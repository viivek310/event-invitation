// Read-only, synthetic Chrome benchmark. Does not submit forms or create accounts.
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const url = process.argv[2] || "http://127.0.0.1:3012/templates/royal-wedding?canvas=1";
const output = process.argv[3];
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on("pageerror", error => console.error("Audit page error:", error.message));
  const response = await page.goto(url);
  if (!response?.ok()) throw new Error(`Preview unavailable (HTTP ${response?.status()}); check database readiness before profiling.`);
  console.error("Audit preview loaded");
  await page.getByRole("button", { name: "Skip introduction" }).click();
  if (process.argv.includes("--hide-explore")) await page.locator("[data-explore-overlay]").evaluate(node => { node.style.display = "none"; });
  console.error("Audit opening skipped");
  const canvas = page.locator("[data-royal-scroll]");
  const events = canvas.locator('[data-section="events"]');
  await events.evaluate(node => {
    const scroller = node.closest("[data-royal-scroll]");
    scroller.scrollTop += node.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
  });
  if (process.argv.includes("--hide-progress")) await page.locator("[data-event-progress]").evaluate(node => { node.style.display = "none"; });
  const cdp = await context.newCDPSession(page);
  await cdp.send("Performance.enable");
  for (const rate of [1, 4]) for (let run = 1; run <= 3; run++) {
    console.error(`Audit CPU rate ${rate}, run ${run}`);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate });
    const before = (await cdp.send("Performance.getMetrics")).metrics;
    const frames = await canvas.evaluate(node => new Promise((resolve, reject) => {
      const watchdog = setTimeout(() => reject(new Error("Animation frame sampling did not finish within 10 seconds.")), 10000);
      const section = node.querySelector('[data-section="events"]');
      const start = node.scrollTop + section.getBoundingClientRect().top - node.getBoundingClientRect().top;
      const distance = section.getBoundingClientRect().height - node.clientHeight;
      const deltas = [];
      let first = 0, last = 0;
      const longTasks = [];
      const observer = new PerformanceObserver(list => list.getEntries().forEach(entry => longTasks.push(entry.duration)));
      observer.observe({ type: "longtask" });
      function frame(time) {
        first ||= time;
        if (last) deltas.push(time - last);
        last = time;
        node.scrollTop = start + Math.min(1, (time - first) / 2400) * distance;
        if (time - first < 2400) requestAnimationFrame(frame);
        else {
          clearTimeout(watchdog);
          observer.disconnect();
          deltas.sort((a, b) => a - b);
          resolve({ frames: deltas.length, p95: deltas[Math.floor(deltas.length * .95)], max: Math.max(...deltas), longTasks });
        }
      }
      requestAnimationFrame(frame);
    }));
    const after = (await cdp.send("Performance.getMetrics")).metrics;
    const duration = name => Math.round((after.find(item => item.name === name).value - before.find(item => item.name === name).value) * 1000);
    results.push({ cpuRate: rate, run, ...frames, scriptMs: duration("ScriptDuration"), layoutMs: duration("LayoutDuration"), styleMs: duration("RecalcStyleDuration") });
  }
  await context.close();
} finally { await browser.close(); }
if (output) { await mkdir(dirname(output), { recursive: true }); await writeFile(output, JSON.stringify({ url, results }, null, 2)); }
console.log(JSON.stringify(results, null, 2));
