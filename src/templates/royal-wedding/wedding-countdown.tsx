"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./invitation.module.css";

export function countdownParts(startsAt: string, now: number) {
  const remaining = Math.max(0, new Date(startsAt).getTime() - now);
  return { remaining, values: [Math.floor(remaining / 86400000), Math.floor(remaining / 3600000) % 24, Math.floor(remaining / 60000) % 60, Math.floor(remaining / 1000) % 60] };
}

export function WeddingCountdown({ startsAt, active }: { startsAt: string; active: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const node = root.current;
    if (!active || !node) return;
    const canvas = node.closest<HTMLElement>("[data-royal-scroll]")!;
    let visible = false;
    let interval: ReturnType<typeof setInterval> | undefined;
    const stop = () => clearInterval(interval);
    const update = () => {
      const time = Date.now();
      setNow(time);
      if (time >= new Date(startsAt).getTime()) stop();
    };
    const synchronize = () => {
      stop();
      if (!visible || document.hidden) return;
      update();
      if (Date.now() < new Date(startsAt).getTime()) interval = setInterval(update, 1000);
    };
    const observer = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      synchronize();
    }, { root: canvas, rootMargin: "80px" });
    observer.observe(node);
    document.addEventListener("visibilitychange", synchronize);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", synchronize); stop(); };
  }, [active, startsAt]);
  const count = now === null ? null : countdownParts(startsAt, now);
  return <div ref={root} className={styles.countdown} aria-label="Time until the wedding" data-detail data-countdown>
    {count?.remaining === 0 ? <p>The celebration has begun</p> : ["Days", "Hours", "Minutes", "Seconds"].map((label, index) => (
      <div key={label}><strong>{count ? String(count.values[index]).padStart(2, "0") : "—"}</strong><span>{label}</span></div>
    ))}
  </div>;
}
