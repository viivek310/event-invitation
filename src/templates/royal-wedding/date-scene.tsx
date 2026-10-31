"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { RoyalWeddingContent } from "./content";
import { formatRoyalDate } from "./content";
import { Flourish } from "./artwork";
import { royalMotion } from "./design";
import { RoyalCorners } from "./royal-corners";
import { ScrollCue } from "./scroll-cue";
import styles from "./invitation.module.css";

gsap.registerPlugin(ScrollTrigger);

export function countdownParts(startsAt: string, now: number) {
  const remaining = Math.max(0, new Date(startsAt).getTime() - now);
  return {
    remaining,
    values: [
      Math.floor(remaining / 86400000),
      Math.floor(remaining / 3600000) % 24,
      Math.floor(remaining / 60000) % 60,
      Math.floor(remaining / 1000) % 60,
    ],
  };
}

export function DateScene({
  content,
  active,
}: {
  content: RoyalWeddingContent;
  active: boolean;
}) {
  const root = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const celebrated = useRef(false);
  const forced = useRef(false);
  const [mode, setMode] = useState<"pending" | "scroll" | "auto" | "reduced">(
    "pending",
  );
  const compact = mode === "auto" || mode === "reduced";
  const focusFrame = useRef(0);
  const [forcedDate, setForcedDate] = useState(false);
  const [settled, setSettled] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  const date = new Date(`${content.weddingDate}T12:00:00Z`);
  const year = date.getUTCFullYear();
  const dayValues = Array.from({ length: date.getUTCDate() }, (_, i) =>
    String(i + 1).padStart(2, "0"),
  );
  const monthValues = Array.from({ length: date.getUTCMonth() + 1 }, (_, i) =>
    new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(
      new Date(Date.UTC(year, i, 1)),
    ),
  );
  const yearValues = Array.from({ length: 4 }, (_, i) => String(year - 3 + i));
  const count =
    now === null ? null : countdownParts(content.weddingStartsAt, now);

  useEffect(() => {
    if (!active || !root.current) return;
    const node = root.current;
    const canvas = node.closest<HTMLElement>("[data-royal-scroll]")!;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const measure = () => {
      node.style.setProperty("--scene-height", `${canvas.clientHeight}px`);
      node.style.setProperty(
        "--date-scene-height",
        `${canvas.clientHeight * (1 + royalMotion.dateRollScreens + royalMotion.dateHoldScreens)}px`,
      );
      setMode(
        media.matches
          ? "reduced"
          : canvas.clientHeight < 520
            ? "auto"
            : "scroll",
      );
      cancelAnimationFrame(frame);
      cancelAnimationFrame(focusFrame.current);
      frame = requestAnimationFrame(() =>
        timeline.current?.scrollTrigger?.refresh(),
      );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(canvas);
    media.addEventListener("change", measure);
    measure();
    return () => {
      observer.disconnect();
      media.removeEventListener("change", measure);
      cancelAnimationFrame(frame);
    };
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const update = () => {
      const time = Date.now();
      setNow(time);
      if (time >= new Date(content.weddingStartsAt).getTime())
        clearInterval(interval);
    };
    const interval = setInterval(update, 1000);
    update();
    return () => clearInterval(interval);
  }, [active, content.weddingStartsAt]);

  useEffect(() => {
    if (!active || !root.current) return;
    if (mode === "pending") return;
    const node = root.current;
    const canvas = node.closest<HTMLElement>("[data-royal-scroll]")!;
    setSettled(false);
    const ctx = gsap.context(() => {
      const tracks = [
        ...node.querySelectorAll<HTMLElement>("[data-wheel-track]"),
      ];
      const details = node.querySelector("[data-date-details]");
      const columns = node.querySelectorAll("[data-wheel-column]");
      const detailItems = node.querySelectorAll("[data-detail]");
      if (mode === "reduced" || forced.current) {
        gsap.set([...tracks, ...columns, ...detailItems], {
          y: 0,
          autoAlpha: 1,
        });
        gsap.set(details, { autoAlpha: 1, y: 0 });
        setSettled(true);
        if (mode === "reduced") setCelebrating(false);
        return;
      }
      gsap.set(tracks, { y: 0 });
      gsap.set(columns, { autoAlpha: 0, y: 12 });
      gsap.set(details, { autoAlpha: 0 });
      const detailsTimeline = gsap
        .timeline({ paused: true })
        .to(details, { autoAlpha: 1, duration: 0.12 })
        .fromTo(
          detailItems,
          { opacity: 0, y: 18 },
          {
            opacity: 1,
            y: 0,
            duration: 0.65,
            stagger: 0.13,
            ease: "power3.out",
          },
          0,
        );
      let wasFinal = false;
      function finishDate(final: boolean) {
        if (forced.current || final === wasFinal) return;
        wasFinal = final;
        setSettled(final);
        if (final) detailsTimeline.restart();
        else {
          detailsTimeline.pause(0);
          gsap.set(details, { autoAlpha: 0 });
          setCelebrating(false);
        }
        if (
          final &&
          !celebrated.current &&
          !matchMedia("(prefers-reduced-motion: reduce)").matches
        ) {
          celebrated.current = true;
          setCelebrating(true);
        }
      }
      const tl = gsap.timeline({
        scrollTrigger:
          mode === "scroll"
            ? {
                trigger: node,
                scroller: canvas,
                start: "top top",
                end: () =>
                  `+=${canvas.clientHeight * royalMotion.dateRollScreens}`,
                scrub: 0.55,
                invalidateOnRefresh: true,
                onUpdate: (self) => {
                  if (self.progress < 1) finishDate(false);
                },
                onScrubComplete: (self) => finishDate(self.progress === 1),
                onRefresh: (self) => {
                  if (self.progress === 1) finishDate(true);
                },
              }
            : { trigger: node, scroller: canvas, start: "top 65%", once: true },
        onComplete: () => finishDate(true),
      });
      tracks.forEach((track, i) => {
        tl.to(
          columns[i],
          { autoAlpha: 1, y: 0, duration: 0.3, ease: "power2.out" },
          i * 0.95,
        );
        tl.to(
          track,
          {
            y: () =>
              -(track.children.length - 1) * track.parentElement!.clientHeight,
            duration: 1.1,
            ease: "power3.inOut",
          },
          i * 0.95 + 0.12,
        );
      });
      timeline.current = tl;
    }, node);
    return () => {
      ctx.revert();
      timeline.current = null;
    };
  }, [active, mode, forcedDate, content.weddingDate]);

  useEffect(() => {
    if (!celebrating || !root.current) return;
    const running = [
      ...root.current.querySelectorAll<HTMLElement>("[data-particle]"),
    ].map((particle, i) => {
      const angle = (i * 137.5 * Math.PI) / 180;
      const spread = 70 + (i % 7) * 24;
      return particle.animate(
        [
          { opacity: 0, transform: "translate(0, 0) rotate(0deg)" },
          {
            opacity: 1,
            transform: `translate(${Math.cos(angle) * spread}px, ${-50 - Math.abs(Math.sin(angle)) * 180}px) rotate(${i * 29}deg)`,
            offset: 0.35,
          },
          {
            opacity: 0,
            transform: `translate(${Math.cos(angle) * spread * 1.3}px, 220px) rotate(${i * 73}deg)`,
          },
        ],
        { duration: royalMotion.confetti, easing: "ease-out", fill: "both" },
      );
    });
    let alive = true;
    void Promise.all(running.map((a) => a.finished))
      .then(() => {
        if (alive) setCelebrating(false);
      })
      .catch(() => {});
    return () => {
      alive = false;
      running.forEach((a) => a.cancel());
    };
  }, [celebrating]);

  function showDate() {
    forced.current = true;
    setForcedDate(true);
    setSettled(true);
    if (
      !matchMedia("(prefers-reduced-motion: reduce)").matches &&
      !celebrated.current
    ) {
      celebrated.current = true;
      setCelebrating(true);
    }
    focusFrame.current = requestAnimationFrame(() =>
      heading.current?.focus({ preventScroll: true }),
    );
  }

  return (
    <section
      ref={root}
      className={styles.dateSection}
      data-section="date"
      data-testid="wedding-date-panel"
      data-date-state={settled ? "settled" : "rolling"}
      data-compact={compact ? "true" : "false"}
      data-date-mode={mode}
      aria-labelledby="royal-date-title"
    >
      <div className={styles.dateSticky}>
        <div className={styles.dateMandala} aria-hidden="true">
          ✧
        </div>
        <h2 className={styles.dateHeading}>{content.dateMessage}</h2>
        <div className={styles.dateFolio}>
          <RoyalCorners />
          <div className={styles.wheels} aria-hidden="true">
            {[dayValues, monthValues, yearValues].map((values, i) => (
              <div key={i} className={styles.wheelColumn} data-wheel-column>
                <span className={styles.wheelLabel}>
                  {["Day", "Month", "Year"][i]}
                </span>
                <div className={styles.wheel}>
                  <div data-wheel-track className={styles.wheelTrack}>
                    {(mode === "reduced" || forcedDate
                      ? [values.at(-1)!]
                      : values
                    ).map((value) => (
                      <span key={value}>{value}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div
            data-date-details
            className={styles.dateDetails}
            aria-hidden={!settled}
          >
            <h2 id="royal-date-title" ref={heading} tabIndex={-1} data-detail>
              Save the Date
              <span className={styles.srOnly}>
                {" "}
                — {formatRoyalDate(content.weddingDate)}
              </span>
            </h2>
            <div data-detail>
              <Flourish className={styles.flourish} />
            </div>
            <div className={styles.dateLocation} data-detail>
              <p>{formatRoyalDate(content.weddingDate)}</p>
              <p>{content.venue}</p>
            </div>
            <div
              className={styles.countdown}
              aria-label="Time until the wedding"
              data-detail
            >
              {count?.remaining === 0 ? (
                <p>The celebration has begun</p>
              ) : (
                ["Days", "Hours", "Minutes", "Seconds"].map((label, i) => (
                  <div key={label}>
                    <strong>
                      {count ? String(count.values[i]).padStart(2, "0") : "—"}
                    </strong>
                    <span>{label}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <button
          type="button"
          className={styles.dateShortcut}
          onClick={showDate}
          aria-label="Show wedding date"
          hidden={settled}
        >
          Show date <span aria-hidden="true">↗</span>
        </button>
        <ScrollCue
          text="Scroll to continue"
          label={settled ? "Scroll to continue to celebrations" : "Scroll to continue"}
        />
        {celebrating && (
          <div
            className={styles.confetti}
            data-testid="date-confetti"
            aria-hidden="true"
          >
            {Array.from({ length: 42 }, (_, i) => (
              <i
                key={i}
                data-particle
                data-petal={i % 3 === 0 ? "true" : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
