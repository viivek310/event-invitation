"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { RoyalWeddingContent } from "./content";
import { formatRoyalDate } from "./content";
import { royalEvents as motion } from "./design";
import { Flourish } from "./artwork";
import { PalaceImage } from "./palace-image";
import { RoyalCorners } from "./royal-corners";
import { RoyalArrow } from "./royal-icons";
import { ScrollCue } from "./scroll-cue";
import styles from "./events-sequence.module.css";
import { observeRoyalViewport, refreshRoyalScroll, royalViewport } from "./scroll-layout";

gsap.registerPlugin(ScrollTrigger);

export function EventsSequence({ content, active }: { content: RoyalWeddingContent; active: boolean }) {
  const root = useRef<HTMLElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const activeRef = useRef(0);
  const pendingFocus = useRef<number | null>(null);
  const navigationTarget = useRef<number | null>(null);
  const navigationTop = useRef<number | null>(null);
  const restore = useRef<number | null>(null);
  const focusFrame = useRef(0);
  const cancelSnap = useRef<(() => void) | null>(null);
  const [layout, setLayout] = useState({ pinned: false, width: 0, height: 0 });
  const [current, setCurrent] = useState(0);
  const events = content.ceremonies;
  const [prepared, setPrepared] = useState<ReadonlySet<string>>(() => new Set(events.slice(0, 2).map(event => event.id)));
  const prepare = useCallback((index: number) => {
    const ids = events.slice(Math.max(0, index - 1), index + 2).map(event => event.id);
    setPrepared(previous => ids.every(id => previous.has(id)) ? previous : new Set([...previous, ...ids]));
  }, [events]);
  useEffect(() => { prepare(current); }, [current, prepare]);

  useLayoutEffect(() => {
    if (!active || !root.current) return;
    const node = root.current;
    const canvas = node.closest<HTMLElement>("[data-royal-scroll]")!;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false;
    let frame = 0;
    let previousWidth = royalViewport(canvas).width;
    let previousHeight = royalViewport(canvas).height;
    let previousGeometry = "";
    const measure = () => {
      if (disposed) return;
      const { width, height } = royalViewport(canvas);
      const stage = node.querySelector<HTMLElement>("[data-event-stage]")!;
      const header = node.querySelector<HTMLElement>("[data-event-heading]")!;
      const footer = node.querySelector<HTMLElement>("[data-event-footer]")!;
      const panels = [...node.querySelectorAll<HTMLElement>("[data-ceremony]")];
      const largestDetails = Math.max(0, ...panels.map(panel =>
        panel.querySelector<HTMLElement>("[data-event-text]")!.offsetHeight +
        panel.querySelector<HTMLElement>("[data-event-date]")!.offsetHeight));
      const css = getComputedStyle(stage);
      const gap = parseFloat(css.rowGap) || 0;
      // Natural text height is preserved; the illustration absorbs size differences.
      const available = Math.floor(height - header.offsetHeight - footer.offsetHeight -
        parseFloat(css.paddingTop) - parseFloat(css.paddingBottom) - gap * 2 - largestDetails - 20);
      node.style.setProperty("--event-height", `${height}px`);
      node.style.setProperty("--event-image-height", `${Math.max(motion.minimumImageHeight,
        Math.min(motion.maximumImageHeight, available))}px`);
      const bounds = node.getBoundingClientRect();
      const canvasBounds = canvas.getBoundingClientRect();
      if ((width !== previousWidth || height !== previousHeight) &&
        bounds.top <= canvasBounds.top + 2 && bounds.bottom > canvasBounds.top && restore.current === null)
        restore.current = activeRef.current;
      previousWidth = width;
      previousHeight = height;
      const pinned = !media.matches && available >= motion.minimumImageHeight && events.length > 1;
      setLayout(previous => previous.pinned === pinned && previous.width === width && previous.height === height
        ? previous : { pinned, width, height });
      const geometry = `${width}:${height}:${available}:${pinned}`;
      if (geometry !== previousGeometry) {
        previousGeometry = geometry;
        refreshRoyalScroll(canvas);
      }
    };
    const schedule = () => {
      if (disposed) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(schedule);
    const stopObserving = observeRoyalViewport(canvas, schedule);
    observer.observe(node.querySelector("[data-event-heading]")!);
    observer.observe(node.querySelector("[data-event-footer]")!);
    node.querySelectorAll("[data-event-text]").forEach(element => observer.observe(element));
    node.addEventListener("load", schedule, true);
    media.addEventListener("change", schedule);
    void document.fonts.ready.then(schedule);
    measure();
    return () => {
      disposed = true;
      observer.disconnect();
      stopObserving();
      node.removeEventListener("load", schedule, true);
      media.removeEventListener("change", schedule);
      cancelAnimationFrame(frame);
      cancelAnimationFrame(focusFrame.current);
    };
  }, [active, events]);

  useLayoutEffect(() => {
    if (!active || !root.current || events.length === 0) return;
    const node = root.current;
    const canvas = node.closest<HTMLElement>("[data-royal-scroll]")!;
    const preservedIndex = navigationTarget.current ?? restore.current ?? activeRef.current;
    const panels = [...node.querySelectorAll<HTMLElement>("[data-ceremony]")];
    let frame = 0;
    let refreshFrame = 0;
    let naturalObserver: IntersectionObserver | undefined;
    let disposeSnap: (() => void) | undefined;
    const select = (index: number, settled: boolean) => {
      const arrived = navigationTop.current === null || Math.abs(canvas.scrollTop - navigationTop.current) <= 2;
      if (navigationTarget.current === index && settled && arrived) navigationTarget.current = null;
      if (index !== activeRef.current) {
        activeRef.current = index;
        setCurrent(index);
      }
      if (pendingFocus.current === index && settled && arrived) {
        pendingFocus.current = null;
        cancelAnimationFrame(focusFrame.current);
        focusFrame.current = requestAnimationFrame(() =>
          panels[index].querySelector<HTMLElement>("h3")?.focus({ preventScroll: true }));
      }
    };
    const ctx = gsap.context(() => {
      if (!layout.pinned) {
        naturalObserver = new IntersectionObserver(entries => {
          const line = canvas.getBoundingClientRect().top + canvas.clientHeight / 2;
          const centered = panels.findIndex(panel => {
            const bounds = panel.getBoundingClientRect();
            return bounds.top <= line && bounds.bottom >= line;
          });
          if (centered >= 0) select(centered, true);
          else {
            const visible = entries.filter(entry => entry.isIntersecting)
              .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
            if (visible) select(panels.indexOf(visible.target as HTMLElement), true);
          }
        }, { root: canvas, threshold: [0, .25, .5, .75, 1] });
        panels.forEach(panel => naturalObserver!.observe(panel));
        if (restore.current !== null || navigationTarget.current !== null) {
          restore.current = null;
          frame = requestAnimationFrame(() => {
            const panel = panels[preservedIndex];
            canvas.scrollTo({ top: canvas.scrollTop + panel.getBoundingClientRect().top - canvas.getBoundingClientRect().top - 12, behavior: "instant" });
            select(preservedIndex, true);
          });
        }
        return;
      }
      const images = panels.map(panel => panel.querySelector("[data-event-image]")!);
      const groups = panels.map(panel => [...panel.querySelectorAll("[data-event-detail]")]);
      const backgrounds = [...node.querySelectorAll("[data-event-background]")];
      const progress = gsap.quickSetter(node.querySelector("[data-event-progress]"), "scaleX");
      panels.forEach((panel, index) => gsap.set(panel, { opacity: index === 0 ? 1 : 0, zIndex: index + 1 }));
      images.forEach((image, index) => gsap.set(image, {
        xPercent: index === 0 ? 0 : 105, opacity: index === 0 ? 1 : 0, scale: index === 0 ? 1 : 1.025 }));
      groups.forEach((group, index) => gsap.set(group, { opacity: index === 0 ? 1 : 0, y: index === 0 ? 0 : 12 }));
      backgrounds.forEach((background, index) => gsap.set(background, { opacity: index === 0 ? 1 : 0 }));
      const arrivals: number[] = [0];
      const total = events.length * motion.holdScreens + (events.length - 1) * motion.transitionScreens + motion.exitScreens;
      let measuringTimeline = false;
      let renderedTime = 0;
      let navigating = false;
      const tl = gsap.timeline({
        onUpdate() {
          // A refresh temporarily rewinds the animation to measure its trigger.
          // Never publish that temporary Welcome frame as the selected ceremony.
          if (measuringTimeline) return;
          // ScrollTrigger can refresh before ResizeObserver rebuilds the layout.
          // Do not replace the selected ceremony with that intermediate geometry.
          const size = royalViewport(canvas);
          if (size.width !== layout.width || size.height !== layout.height) {
            const bounds = node.getBoundingClientRect();
            const canvasBounds = canvas.getBoundingClientRect();
            if (restore.current === null && bounds.top <= canvasBounds.top + 2 && bounds.bottom > canvasBounds.top)
              restore.current = activeRef.current;
            return;
          }
          const time = this.time();
          let index = 0;
          for (let i = 1; i < arrivals.length; i++) if (time >= arrivals[i] - motion.transitionScreens * 0.2) index = i;
          select(index, time >= arrivals[index] - 0.002);
          progress(time / total);
        },
        scrollTrigger: { trigger: node, scroller: canvas, start: "top top", end: () => `+=${layout.height * total}`,
          scrub: layout.width < 700 ? motion.mobileScrub : motion.desktopScrub,
          snap: {
            delay: motion.snapDelay / 1000,
            duration: { min: motion.snapMinDuration, max: motion.snapMaxDuration },
            ease: "power2.inOut",
            inertia: false,
            snapTo(value, self) {
              const size = royalViewport(canvas);
              if (!self || navigating || measuringTimeline || navigationTarget.current !== null || restore.current !== null ||
                size.width !== layout.width || size.height !== layout.height) return value;
              const time = value * total;
              for (let i = 1; i < events.length; i++) {
                const departure = (i - 1) * (motion.holdScreens + motion.transitionScreens) + motion.holdScreens;
                const arrival = departure + motion.transitionScreens;
                if (time > departure && time < arrival) return (self.direction > 0 ? arrival : departure) / total;
              }
              return value;
            },
          },
          onRefreshInit(self) {
            measuringTimeline = true;
            renderedTime = self.animation?.time() ?? 0;
            cancelSnap.current?.();
          },
          onRefresh(self) {
            // All motion values are fixed or percentages. Only layout changes
            // rebuild them; an image-load refresh must preserve the rendered frame.
            self.animation?.time(renderedTime, true);
            measuringTimeline = false;
          } },
      });
      tl.addLabel(`${events[0].id}:arrival`, 0);
      tl.addLabel(`${events[0].id}:reading`, motion.holdScreens / 2);
      tl.to({}, { duration: motion.holdScreens });
      for (let i = 1; i < events.length; i++) {
        const start = tl.duration();
        const duration = motion.transitionScreens;
        tl.addLabel(`${events[i - 1].id}:departure`, start);
        tl.addLabel(`${events[i].id}:transition`, start);
        tl.to(groups[i - 1], { opacity: 0, y: -12, duration: duration * 0.35, ease: "power2.in", stagger: 0.008 }, start);
        tl.to(images[i - 1], { xPercent: -105, opacity: 0, duration: duration * 0.55, ease: "power2.inOut" }, start + duration * 0.05);
        tl.to(panels[i - 1], { opacity: 0, duration: duration * 0.15 }, start + duration * 0.5);
        tl.set(panels[i], { opacity: 1 }, start + duration * 0.35);
        tl.to(images[i], { xPercent: 0, opacity: 1, scale: 1, duration: duration * 0.65, ease: "power3.out" }, start + duration * 0.35);
        tl.to(groups[i], { opacity: 1, y: 0, duration: duration * 0.25, stagger: duration * 0.04, ease: "power2.out" }, start + duration * 0.55);
        tl.to(backgrounds[i - 1], { opacity: 0, duration: duration * 0.8, ease: "sine.inOut" }, start);
        tl.to(backgrounds[i], { opacity: 1, duration: duration * 0.8, ease: "sine.inOut" }, start);
        const arrival = start + duration;
        arrivals.push(arrival);
        tl.addLabel(`${events[i].id}:arrival`, arrival);
        tl.addLabel(`${events[i].id}:reading`, arrival + motion.holdScreens / 2);
        tl.to({}, { duration: motion.holdScreens }, arrival);
      }
      const exit = tl.duration();
      tl.addLabel(`${events.at(-1)!.id}:departure`, exit);
      // Keep the final scene readable; CSS sticky releases it naturally.
      tl.to({}, { duration: motion.exitScreens }, exit);
      timeline.current = tl;
      // ScrollTrigger owns the scroll tween as well as the scrubbed visuals. Its
      // velocity/pointer checks wait for momentum, and its interruption tracker
      // yields to native scrolling instead of racing a separate scrollTop tween.
      const stop = () => {
        // ScrollTrigger uses 0 as its cleared-tween sentinel after a refresh.
        // Optional chaining only handles null/undefined, not that numeric value.
        const snapTween = tl.scrollTrigger?.getTween(true);
        if (snapTween && typeof snapTween.kill === "function") snapTween.kill();
      };
      cancelSnap.current = stop;
      const interrupt = () => {
        stop();
        navigating = false;
        navigationTarget.current = null;
        navigationTop.current = null;
        pendingFocus.current = null;
        cancelAnimationFrame(focusFrame.current);
      };
      const key = (event: KeyboardEvent) => {
        if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " ", "Escape", "Tab"].includes(event.key)) interrupt();
      };
      const navigate = () => {
        stop();
        navigating = true;
        navigationTarget.current = null;
        navigationTop.current = null;
        pendingFocus.current = null;
        cancelAnimationFrame(focusFrame.current);
      };
      canvas.addEventListener("wheel", interrupt, { passive: true });
      canvas.addEventListener("pointerdown", interrupt, { passive: true });
      canvas.addEventListener("keydown", key);
      canvas.addEventListener("royal-section-navigation", navigate);
      canvas.addEventListener("royal-ceremony-navigation", navigate);
      disposeSnap = () => {
        stop();
        cancelSnap.current = null;
        canvas.removeEventListener("wheel", interrupt);
        canvas.removeEventListener("pointerdown", interrupt);
        canvas.removeEventListener("keydown", key);
        canvas.removeEventListener("royal-section-navigation", navigate);
        canvas.removeEventListener("royal-ceremony-navigation", navigate);
      };
      frame = requestAnimationFrame(() => {
        refreshRoyalScroll(canvas);
        if ((restore.current !== null || navigationTarget.current !== null) && tl.scrollTrigger) {
          restore.current = null;
          const trigger = tl.scrollTrigger;
          const time = tl.labels[`${events[preservedIndex].id}:reading`];
          const top = trigger.start + (trigger.end - trigger.start) * time / tl.duration();
          navigationTop.current = top;
          canvas.scrollTo({ top, behavior: "instant" });
          tl.time(time);
        }
        refreshFrame = requestAnimationFrame(() => refreshRoyalScroll(canvas));
      });
    }, node);
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(refreshFrame);
      cancelAnimationFrame(focusFrame.current);
      disposeSnap?.();
      ctx.revert();
      naturalObserver?.disconnect();
      timeline.current = null;
    };
  }, [active, layout, events]);

  function goTo(index: number, keyboard: boolean) {
    const node = root.current;
    const canvas = node?.closest<HTMLElement>("[data-royal-scroll]");
    if (!node || !canvas) return;
    cancelSnap.current?.();
    canvas.dispatchEvent(new Event("royal-ceremony-navigation"));
    cancelAnimationFrame(focusFrame.current);
    navigationTarget.current = index;
    prepare(index);
    pendingFocus.current = keyboard ? index : null;
    const tl = timeline.current;
    if (layout.pinned && tl?.scrollTrigger) {
      const trigger = tl.scrollTrigger;
      const top = trigger.start + (trigger.end - trigger.start) * tl.labels[`${events[index].id}:reading`] / tl.duration();
      navigationTop.current = top;
      canvas.scrollTo({ top, behavior: "smooth" });
      if (Math.abs(canvas.scrollTop - top) <= 2 && activeRef.current === index &&
        tl.time() >= tl.labels[`${events[index].id}:arrival`] &&
        tl.time() <= tl.labels[`${events[index].id}:departure`]) {
        navigationTarget.current = null;
        if (keyboard) {
          pendingFocus.current = null;
          focusFrame.current = requestAnimationFrame(() => node.querySelectorAll<HTMLElement>("h3")[index]?.focus({ preventScroll: true }));
        }
      }
    } else {
      navigationTop.current = null;
      const panel = node.querySelectorAll<HTMLElement>("[data-ceremony]")[index];
      canvas.scrollTo({ top: canvas.scrollTop + panel.getBoundingClientRect().top - canvas.getBoundingClientRect().top - 12,
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
      if (keyboard) panel.querySelector<HTMLElement>("h3")?.focus({ preventScroll: true });
      activeRef.current = index;
      navigationTarget.current = null;
      setCurrent(index);
    }
  }

  const screens = 1 + events.length * motion.holdScreens + Math.max(0, events.length - 1) * motion.transitionScreens + motion.exitScreens;
  return (
    <section ref={root} className={styles.events} data-section="events"
      data-events-pinned={layout.pinned ? "true" : "false"} data-current-ceremony={events[current]?.id}
      aria-labelledby="royal-events-title" style={{ "--event-screens": screens } as CSSProperties}>
      <div className={styles.stage} data-event-stage>
        <div className={styles.backgrounds} aria-hidden="true">
          {events.map(event => <div key={event.id} data-event-background style={{
            background: `radial-gradient(ellipse at 50% 35%, ${motion.accents[event.id].glow}80, transparent 65%), ${motion.accents[event.id].background}`,
          }} />)}
        </div>
        <header className={styles.heading} data-event-heading data-event-chrome>
          <h2 id="royal-events-title">The Celebrations</h2>
        </header>
        <div className={styles.deck}>
          {events.map((event, index) => (
            <article key={event.id} className={styles.panel} data-ceremony={event.id}
              style={{ "--event-accent": motion.accents[event.id].accent } as CSSProperties}
              aria-hidden={layout.pinned && current !== index ? true : undefined}
              inert={layout.pinned && current !== index ? true : undefined}>
              <time className={styles.date} dateTime={event.date} data-event-date data-event-detail>
                {formatRoyalDate(event.date, "short")} <span>· Jaipur</span>
              </time>
              <div className={styles.imageWindow}>
                <div className={styles.image} data-event-image>
                  <PalaceImage scene={event.id} prepared={!layout.pinned || prepared.has(event.id)} eager={index < 2 || index === current + 1} />
                  <RoyalCorners />
                </div>
              </div>
              <div className={styles.details} data-event-text>
                <div data-event-detail><h3 tabIndex={-1}>{event.name}</h3>
                  <p className={styles.description}>{event.description}</p></div>
                <Flourish className={styles.divider} />
                <div data-event-detail><p className={styles.venue}>{event.venue}</p>
                  <p className={styles.address}>{event.address}</p></div>
                <div data-event-detail><p className={styles.time}>{event.time}</p>
                  <a href={event.mapUrl} target="_blank" rel="noopener noreferrer"
                    aria-label={`View Jaipur map for ${event.name}`}>View city map <RoyalArrow direction="outward" /></a></div>
              </div>
            </article>
          ))}
        </div>
        <footer className={styles.footer} data-event-footer data-event-chrome>
          <div className={styles.selected}><span>{events[current]?.name}</span><span>{String(current + 1).padStart(2, "0")} / {String(events.length).padStart(2, "0")}</span></div>
          <nav className={styles.navigation} aria-label="Wedding ceremonies">
            {events.map((event, index) => <button key={event.id} type="button" data-event-nav
              aria-label={`Go to ${event.name}`} title={event.name} aria-current={current === index ? "step" : undefined}
              onClick={event => goTo(index, event.detail === 0)}><span /><span className={styles.srOnly}>{event.name}</span></button>)}
            <div className={styles.progress} aria-hidden="true"><i data-event-progress /></div>
          </nav>
          <ScrollCue
            text="Scroll to continue"
            label={current === events.length - 1 ? "Scroll to continue the invitation" : "Scroll to continue to next ceremony"}
          />
        </footer>
      </div>
    </section>
  );
}
