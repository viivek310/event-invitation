"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { RoyalWeddingContent } from "./content";
import { formatRoyalDate } from "./content";
import { Flourish } from "./artwork";
import { royalMotion } from "./design";
import { RoyalCorners } from "./royal-corners";
import { RoyalMark } from "./royal-icons";
import { ScrollCue } from "./scroll-cue";
import styles from "./invitation.module.css";
import { observeRoyalViewport, refreshRoyalScroll, royalViewport } from "./scroll-layout";
import { WeddingCountdown } from "./wedding-countdown";
export { countdownParts } from "./wedding-countdown";

gsap.registerPlugin(ScrollTrigger);

export function DateScene({
  content,
  active,
}: {
  content: RoyalWeddingContent;
  active: boolean;
}) {
  const root = useRef<HTMLElement>(null);
  const celebrated = useRef(false);
  const [mode, setMode] = useState<"pending" | "scroll" | "auto" | "reduced">(
    "pending",
  );
  const compact = mode === "auto" || mode === "reduced";
  const [settled, setSettled] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
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

  useEffect(() => {
    if (!active || !root.current) return;
    const node = root.current;
    const canvas = node.closest<HTMLElement>("[data-royal-scroll]")!;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const measure = () => {
      const { height } = royalViewport(canvas);
      node.style.setProperty("--scene-height", `${height}px`);
      node.style.setProperty(
        "--date-scene-height",
        `${height * (1 + royalMotion.dateRollScreens + royalMotion.dateCelebrationScreens + royalMotion.dateHoldScreens)}px`,
      );
      const sticky = node.querySelector<HTMLElement>(`[data-date-sticky]`)!;
      const inset = parseFloat(getComputedStyle(sticky).getPropertyValue("--date-pinned-inset")) || 35;
      const requiredHeight = [...sticky.children].reduce((total, child) => {
        const element = child as HTMLElement;
        const css = getComputedStyle(element);
        if (css.position === "absolute") return total;
        return total + element.offsetHeight + (parseFloat(css.marginTop) || 0) + (parseFloat(css.marginBottom) || 0);
      }, inset * 2);
      setMode(
        media.matches
          ? "reduced"
          : height < 520 || requiredHeight > height
            ? "auto"
            : "scroll",
      );
      refreshRoyalScroll(canvas);
    };
    const stopObserving = observeRoyalViewport(canvas, measure);
    const observer = new ResizeObserver(measure);
    node.querySelectorAll("[data-date-card], [data-date-heading], [data-scroll-cue]").forEach(element => observer.observe(element));
    media.addEventListener("change", measure);
    measure();
    return () => {
      stopObserving();
      observer.disconnect();
      media.removeEventListener("change", measure);
    };
  }, [active]);

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
      if (mode === "reduced") {
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
        if (final === wasFinal) return;
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
                  `+=${royalViewport(canvas).height * royalMotion.dateRollScreens}`,
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
    }, node);
    return () => {
      ctx.revert();
    };
  }, [active, mode, content.weddingDate]);

  useEffect(() => {
    if (!celebrating || !root.current) return;
    const stage = root.current.querySelector<HTMLElement>("[data-date-sticky]")!;
    const card = stage.querySelector<HTMLElement>("[data-date-card]")!.getBoundingClientRect();
    const bounds = stage.getBoundingClientRect();
    const width = bounds.width;
    const height = bounds.height;
    const colors = ["#D6BC83", "#F0DDB3", "#B68A50", "#E8CCA0"];
    const running = [
      ...root.current.querySelectorAll<HTMLElement>("[data-particle]"),
    ].map((particle, i) => {
      const seed = (salt: number) => {
        const value = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453;
        return value - Math.floor(value);
      };
      const petal = particle.hasAttribute("data-petal");
      const side = i % 2 === 0 ? 1 : -1;
      const originX = card.left - bounds.left + card.width * (side > 0 ? .12 : .88);
      const originY = card.top - bounds.top + card.height * .7;
      const spread = width * (.12 + seed(1) * .2) * side;
      const lift = height * (.55 + seed(2) * .24);
      const fall = height * (1.05 + seed(3) * .25);
      const spin = (petal ? 110 : 480) * (seed(4) > .5 ? 1 : -1);
      particle.style.background = petal ? (i % 8 === 0 ? "#D7A7B2" : "#F0DDC8") : colors[i % colors.length];
      particle.style.width = `${petal ? 7 + seed(5) * 3 : 3 + seed(5) * 3}px`;
      particle.style.height = `${petal ? 11 + seed(6) * 4 : 6 + seed(6) * 4}px`;
      const frames = Array.from({ length: 25 }, (_, step) => {
        const t = step / 24;
        const x = originX + spread * (1 - Math.exp(-2.8 * t)) + Math.sin(t * Math.PI * 5 + seed(7) * 6) * t * 12;
        const y = originY - lift * (1 - Math.pow(1 - t, 3)) + fall * t * t;
        return { offset: t, opacity: t === 0 || t === 1 ? 0 : t < .75 ? .9 : (1 - t) * 3.6,
          transform: `translate3d(${x}px, ${y}px, 0) rotate(${seed(8) * 180 + spin * t}deg) rotateY(${t * (petal ? 160 : 640)}deg)` };
      });
      return particle.animate(frames, { duration: royalMotion.confetti * (.85 + seed(9) * .15),
        delay: seed(10) * 160, easing: "linear", fill: "both" });
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
      <div className={styles.dateSticky} data-date-sticky>
        <div className={styles.dateMandala} aria-hidden="true">
          <RoyalMark />
        </div>
        <h2 className={styles.dateHeading} data-date-heading>{content.dateMessage}</h2>
        <div className={styles.dateFolio} data-date-card>
          <RoyalCorners />
          <div className={styles.wheels} aria-hidden="true">
            {[dayValues, monthValues, yearValues].map((values, i) => (
              <div key={i} className={styles.wheelColumn} data-wheel-column>
                <span className={styles.wheelLabel}>
                  {["Day", "Month", "Year"][i]}
                </span>
                <div className={styles.wheel}>
                  <div data-wheel-track className={styles.wheelTrack}>
                    {(mode === "reduced"
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
            <h2 id="royal-date-title" data-detail>
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
            </div>
            <WeddingCountdown startsAt={content.weddingStartsAt} active={active} />
          </div>
        </div>
        <ScrollCue
          className={styles.dateScrollCue}
          text="Scroll to continue"
          label={settled ? "Scroll to continue to celebrations" : "Scroll to continue"}
        />
        {celebrating && (
          <div
            className={styles.confetti}
            data-testid="date-confetti"
            aria-hidden="true"
          >
            {Array.from({ length: royalMotion.confettiParticles }, (_, i) => (
              <i
                key={i}
                data-particle
                data-petal={i % 4 === 0 ? "true" : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
