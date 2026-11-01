"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { royalEvents, royalMotion } from "./design";
import { royalViewport } from "./scroll-layout";
import styles from "./explore.module.css";
import { RoyalArrow } from "./royal-icons";

const labels: Record<string, string> = { invitation: "Invitation", date: "Date", events: "Events", rsvp: "RSVP", invitee: "Family" };
type Target = { id: string; node: HTMLElement };

export function RoyalExplore({ canvas, active }: { canvas: RefObject<HTMLElement | null>; active: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const [targets, setTargets] = useState<Target[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState("");
  const cancelNavigation = useRef<(() => void) | null>(null);
  const keyboardOpen = useRef(false);

  useLayoutEffect(() => {
    const root = canvas.current;
    if (!active || !root) return;
    let observer: IntersectionObserver | undefined;
    const collect = () => {
      observer?.disconnect();
      const items = [...root.querySelectorAll<HTMLElement>("[data-section]")]
        .filter(node => !!labels[node.dataset.section!]).map(node => ({ id: node.dataset.section!, node }));
      setTargets(items);
      observer = new IntersectionObserver(() => {
        const line = root.getBoundingClientRect().top + root.clientHeight * .35;
        const selected = items.find(item => {
          const bounds = item.node.getBoundingClientRect();
          return bounds.top <= line && bounds.bottom > line;
        });
        setCurrent(selected?.id || items[0]?.id || "");
      }, { root, rootMargin: "-30% 0px -60% 0px" });
      items.forEach(item => observer!.observe(item.node));
    };
    collect();
    const body = root.querySelector('[data-testid="royal-body"]');
    const mutations = new MutationObserver(collect);
    if (body) mutations.observe(body, { childList: true });
    return () => { observer?.disconnect(); mutations.disconnect(); cancelNavigation.current?.(); };
  }, [active, canvas]);

  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const updateFocus = () => {
      const element = document.activeElement;
      const inField = !!element && !!canvas.current?.contains(element) && element.matches("input, textarea, select, [contenteditable='true']");
      setEditing(inField);
      if (inField) cancelNavigation.current?.();
      if (inField || (host.current && element && !host.current.contains(element))) setOpen(false);
    };
    const afterFocus = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(updateFocus); };
    document.addEventListener("focusin", updateFocus);
    document.addEventListener("focusout", afterFocus);
    return () => { document.removeEventListener("focusin", updateFocus); document.removeEventListener("focusout", afterFocus); cancelAnimationFrame(frame); };
  }, [active, canvas]);

  useEffect(() => {
    if (!open) return;
    const root = canvas.current;
    const outside = (event: PointerEvent) => { if (!host.current?.contains(event.target as Node)) setOpen(false); };
    const key = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      toggle.current?.focus({ preventScroll: true });
    };
    const scroll = () => setOpen(false);
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", key);
    root?.addEventListener("scroll", scroll, { passive: true });
    const frame = keyboardOpen.current ? requestAnimationFrame(() => host.current?.querySelector<HTMLElement>("nav button")?.focus()) : 0;
    return () => {
      document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", key);
      root?.removeEventListener("scroll", scroll); cancelAnimationFrame(frame);
    };
  }, [open, canvas]);

  function goTo(target: Target) {
    const root = canvas.current;
    if (!root) return;
    cancelNavigation.current?.();
    setOpen(false);
    const height = royalViewport(root).height;
    let top = root.scrollTop + target.node.getBoundingClientRect().top - root.getBoundingClientRect().top;
    if (target.id === "date" && target.node.dataset.dateMode === "scroll") top += height * (royalMotion.dateRollScreens + .12);
    if (target.id === "events" && target.node.dataset.eventsPinned === "true") top += height * royalEvents.holdScreens / 2;
    top = Math.max(0, Math.min(top, root.scrollHeight - root.clientHeight));
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const instant = reduced || Math.abs(top - root.scrollTop) > height * 1.5;
    const controller = new AbortController();
    let frame = 0;
    const cancel = () => { controller.abort(); cancelAnimationFrame(frame); };
    cancelNavigation.current = cancel;
    const interrupt = () => { root.scrollTo({ top: root.scrollTop, behavior: "instant" }); cancel(); };
    root.addEventListener("wheel", interrupt, { passive: true, signal: controller.signal });
    root.addEventListener("touchstart", interrupt, { passive: true, signal: controller.signal });
    document.addEventListener("pointerdown", interrupt, { passive: true, signal: controller.signal });
    document.addEventListener("keydown", event => {
      if (["Escape", "Tab", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) interrupt();
    }, { signal: controller.signal });
    root.scrollTo({ top, behavior: instant ? "instant" : "smooth" });
    root.dispatchEvent(new CustomEvent("royal-section-navigation", { detail: target.id }));
    const started = performance.now();
    function focus(now: number) {
      if (controller.signal.aborted) return;
      const heading = target.node.querySelector<HTMLElement>(target.id === "date" ? "#royal-date-title" : "h1, h2");
      const css = heading && getComputedStyle(heading);
      const hidden = heading?.closest('[aria-hidden="true"]');
      const waitingForDate = target.id === "date" && target.node.dataset.dateState !== "settled";
      const bounds = heading?.getBoundingClientRect();
      const viewport = root!.getBoundingClientRect();
      if (heading && css?.visibility !== "hidden" && Number(css?.opacity) > .95 && !hidden && !waitingForDate && bounds &&
          Math.abs(root!.scrollTop - top) < 2 && bounds.bottom > viewport.top && bounds.top < viewport.bottom) {
        const previous = heading.getAttribute("tabindex");
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
        if (previous === null) heading.addEventListener("blur", () => heading.removeAttribute("tabindex"), { once: true });
        cancel();
        return;
      }
      if (now - started < 4000) frame = requestAnimationFrame(focus);
      else cancel();
    }
    frame = requestAnimationFrame(focus);
  }

  if (!active || editing || !targets.length) return null;
  return <div className={styles.overlay} data-explore-overlay><div className={styles.control} ref={host}>
    <button ref={toggle} type="button" className={styles.toggle} aria-expanded={open} aria-controls="royal-explore-sections"
      onClick={event => { keyboardOpen.current = event.detail === 0; setOpen(value => !value); }}>Explore
      <RoyalArrow direction="chevron" className={styles.chevron} />
    </button>
    {open && <nav id="royal-explore-sections" className={styles.panel} aria-label="Explore invitation">
      <p>Your celebration</p>
      {targets.map(target => <button key={target.id} type="button" aria-current={current === target.id ? "location" : undefined}
        onClick={() => goTo(target)}>{labels[target.id]}</button>)}
    </nav>}
  </div></div>;
}
