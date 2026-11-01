"use client";

import { Children, cloneElement, isValidElement, useLayoutEffect, useRef } from "react";
import type { TemplateProps } from "../types";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flourish } from "./artwork";
import type { RoyalWeddingContent } from "./content";
import { royalBody, royalDisplay } from "./fonts";
import { DateScene } from "./date-scene";
import { PalaceImage } from "./palace-image";
import { EventsSequence } from "./events-sequence";
import { RsvpReview } from "./rsvp-review";
import { RoyalCorners } from "./royal-corners";
import { RoyalMark } from "./royal-icons";
import { ScrollCue } from "./scroll-cue";
import { royalCreator } from "./design";
import styles from "./invitation.module.css";
import { observeRoyalViewport, refreshRoyalScroll, royalViewport } from "./scroll-layout";

gsap.registerPlugin(ScrollTrigger);
export type RoyalReviewMode = "demo" | "admin-review" | "live";

export function RoyalWeddingBody({
  content,
  active,
  mode = "demo",
  sections = ["invitation", "date", "events", "rsvp", "invitee"],
  live,
}: {
  content: RoyalWeddingContent;
  active: boolean;
  mode?: RoyalReviewMode;
  sections?: readonly string[];
  live?: TemplateProps["live"];
}) {
  const root = useRef<HTMLDivElement>(null);
  const revealedGroups = useRef(new WeakSet<HTMLElement>());
  useLayoutEffect(() => {
    if (!active || !root.current) return;
    const node = root.current;
    const canvas = node.closest<HTMLElement>("[data-royal-scroll]")!;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let ctx: gsap.Context | undefined;
    let frame = 0;
    const settleSections = new Map<string, () => void>();
    const settleGroups = new Map<HTMLElement, () => void>();
    function setup() {
      ctx?.revert();
      settleSections.clear();
      settleGroups.clear();
      if (media.matches) return;
      ctx = gsap.context(() => {
        node.querySelectorAll<HTMLElement>("[data-scene]").forEach((scene) => {
          if (scene.dataset.section === "invitation") {
            const sequence = gsap.timeline({
              scrollTrigger: {
                trigger: scene,
                scroller: canvas,
                start: "top 95%",
                once: true,
              },
            });
            const backdrop = canvas.querySelector("[data-palace-backdrop]");
            if (backdrop)
              sequence.fromTo(
                backdrop,
                { opacity: 0 },
                { opacity: 1, duration: 1.4, ease: "power2.inOut" },
                0,
              );
            sequence.fromTo(
              scene.querySelector(`.${styles.heroContent}`),
              { autoAlpha: 0 },
              {
                autoAlpha: 1,
                duration: 0.9,
                ease: "power2.inOut",
              },
              0.3,
            );
            sequence.fromTo(
              scene.querySelectorAll("[data-heritage-panel]"),
              { autoAlpha: 0, y: 12 },
              {
                autoAlpha: 1,
                y: 0,
                duration: 0.8,
                stagger: 0.12,
                ease: "power2.out",
              },
              0.5,
            );
            return;
          }
          if (scene.querySelector('[data-section="rsvp"]')) {
            const sequence = gsap.timeline({
              scrollTrigger: { trigger: scene, scroller: canvas, start: "top 88%", once: true },
            });
            sequence.from(scene.querySelector("[data-rsvp-heading]"),
              { opacity: 0, y: 12, duration: 0.65, ease: "power2.out" }, 0);
            sequence.from(scene.querySelector(`.${styles.rsvpSurface}`),
              { opacity: 0, duration: 0.75, ease: "power2.out" }, 0.08);
            scene.querySelectorAll<HTMLElement>("[data-rsvp-group]").forEach(group => {
              if (revealedGroups.current.has(group)) return;
              const tween = gsap.fromTo(group, { opacity: 0, y: 12 }, {
                opacity: 1, y: 0, duration: 0.65, ease: "power2.out",
                onComplete: () => { revealedGroups.current.add(group); },
                scrollTrigger: { trigger: group, scroller: canvas, start: "top 95%", once: true },
              });
              settleGroups.set(group, () => { tween.progress(1); });
            });
            settleSections.set("rsvp", () => {
              sequence.progress(1);
              const bounds = canvas.getBoundingClientRect();
              settleGroups.forEach((settle, group) => {
                const rect = group.getBoundingClientRect();
                if (rect.top < bounds.bottom && rect.bottom > bounds.top) settle();
              });
            });
            return;
          }
          if (scene.dataset.section === "invitee") {
            const paper = scene.querySelector(`.${styles.closingCard}`);
            const sequence = gsap.timeline({
              scrollTrigger: { trigger: scene, scroller: canvas, start: "top 88%", once: true },
            });
            sequence.from(scene.querySelector("[data-closing-badge]"),
              { opacity: 0, y: 8, duration: 0.55, ease: "power2.out" }, 0);
            if (paper) {
              sequence.from(paper, { opacity: 0, duration: 0.75, ease: "power2.out" }, 0.1);
              sequence.from(paper.querySelectorAll("[data-enter]"),
                { opacity: 0, y: 10, duration: 0.6, stagger: 0.07, ease: "power2.out" }, 0.25);
            }
            sequence.from(scene.querySelector(`.${styles.creatorCredit}`),
              { opacity: 0, y: 8, duration: 0.6, ease: "power2.out" }, 0.6);
            settleSections.set("invitee", () => { sequence.progress(1); });
            return;
          }
          const entrance = gsap.timeline({
            scrollTrigger: {
              trigger: scene,
              scroller: canvas,
              start: "top 88%",
              once: true,
            },
          });
          const image = scene.querySelector("picture");
          const text = scene.querySelectorAll("[data-enter]");
          const paper = scene.querySelector(
            `.${styles.heroContent}, .${styles.eventPaper}, .${styles.closingCard}`,
          );
          if (paper)
            entrance.from(
              paper,
              {
                y: 38,
                rotationX: 3,
                transformPerspective: 1000,
                opacity: 0,
                duration: 1.1,
                ease: "power3.out",
              },
              0.15,
            );
          const ornaments = scene.querySelectorAll("path[pathLength]");
          if (ornaments.length)
            entrance.fromTo(
              ornaments,
              { strokeDasharray: 1, strokeDashoffset: 1 },
              {
                strokeDashoffset: 0,
                duration: 1.15,
                stagger: 0.08,
                ease: "power2.inOut",
              },
              0.45,
            );
          if (image)
            entrance.from(
              image,
              {
                scale: 1.075,
                opacity: 0.5,
                duration: 1.8,
                ease: "power2.out",
              },
              0,
            );
          if (text.length)
            entrance.fromTo(
              text,
              {
                opacity: 0,
                y: 22,
                clipPath: "inset(0 0 100% 0)",
              },
              {
                opacity: 1,
                y: 0,
                clipPath: "inset(-8% -4% -12% -4%)",
                duration: 0.8,
                stagger: 0.1,
                ease: "power2.out",
              },
              0.5,
            );
        });
      }, node);
    }
    let previousGeometry = "";
    const refresh = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const intro = node.querySelector<HTMLElement>('[data-section="invitation"]');
        const header = canvas.querySelector<HTMLElement>('[data-testid="royal-invitation-header"]');
        if (intro) canvas.style.setProperty("--royal-backdrop-height", `${Math.ceil(intro.offsetHeight + (header?.offsetHeight ?? 0) + 80)}px`);
          const { width, height } = royalViewport(canvas);
          const geometry = `${width}:${height}:${canvas.scrollHeight}:${intro?.offsetHeight}:${header?.offsetHeight}`;
          if (geometry !== previousGeometry) {
            previousGeometry = geometry;
            refreshRoyalScroll(canvas);
          }
      });
    };
    const observer = new ResizeObserver(refresh);
    const intro = node.querySelector('[data-section="invitation"]');
    if (intro) observer.observe(intro);
    const stopObserving = observeRoyalViewport(canvas, refresh);
    node.addEventListener("load", refresh, true);
    media.addEventListener("change", setup);
    const focus = (event: FocusEvent) => {
      if ((event.target as HTMLElement).closest('[data-section="invitee"]')) settleSections.get("invitee")?.();
      const group = (event.target as HTMLElement).closest<HTMLElement>("[data-rsvp-group]");
      if (!group) return;
      settleSections.get("rsvp")?.();
      settleGroups.get(group)?.();
    };
    canvas.addEventListener("focusin", focus);
    setup();
    return () => {
      ctx?.revert();
      observer.disconnect();
      stopObserving();
      node.removeEventListener("load", refresh, true);
      canvas.removeEventListener("focusin", focus);
      media.removeEventListener("change", setup);
      cancelAnimationFrame(frame);
    };
  }, [active, mode, sections]);

  const body = (
    <div
      ref={root}
      className={`${styles.invitation} ${royalDisplay.variable} ${royalBody.variable}`}
      data-testid="royal-body"
      data-review-mode={mode}
    >
      <section
        className={styles.mainInvitation}
        data-section="invitation"
        data-scene
        aria-labelledby="royal-couple-title"
      >
        <div className={styles.heroContent}>
          <RoyalCorners />
          <div className={styles.heritageTitle} data-heritage-panel>
            <p className={styles.eyebrow}>Welcome to our beginning</p>
            <h1 id="royal-couple-title" className={styles.coupleNames}>
              <span data-name>{content.partnerOne}</span>
              <span className={styles.nameJoiner}>&amp;</span>
              <span data-name>{content.partnerTwo}</span>
            </h1>
            <Flourish className={styles.flourish} />
          </div>
          <div data-hero-support className={styles.heroSupport}>
            <div className={styles.heritageQuote} data-heritage-panel>
              <p>{content.invitationLead}</p>
            </div>
            <Flourish className={styles.flourish} />
            <div className={styles.heritageFamily} data-heritage-panel>
              <p className={styles.lineageName}>{content.partnerOne}</p>
              <p>{content.partnerOneParents}</p>
              <span className={styles.lineageAnd}>and</span>
              <p className={styles.lineageName}>{content.partnerTwo}</p>
              <p>{content.partnerTwoParents}</p>
            </div>
            <Flourish className={styles.flourish} />
            <div className={styles.heritageMessage} data-heritage-panel>
              <p className={styles.invitationMessage}>{content.message}</p>
            </div>
            <span className={styles.heroSignature}>
              Two hearts. One beautiful beginning.
            </span>
          </div>
        </div>
        <ScrollCue text="Scroll to continue" />
      </section>
      <DateScene content={content} active={active} />
      <EventsSequence content={content} active={active} />
      {(mode === "demo" || mode === "admin-review" || (mode === "live" && live)) && (
        <div className={styles.correspondence} data-scene data-body-section="rsvp">
          <RsvpReview content={content} demo={mode === "demo"} live={mode === "live" ? live : undefined} />
        </div>
      )}
      <section
        className={styles.inviteeSection}
        data-section="invitee"
        data-scene
        aria-labelledby="royal-invitee-title"
      >
        <h2 id="royal-invitee-title" className={styles.closingBadge} data-closing-badge>
          <span aria-hidden="true" />Inviting You<span aria-hidden="true" />
        </h2>
        <div className={styles.closingCard}>
          <RoyalCorners />
          <p className={styles.closingLead} data-enter>
            {content.invitee.introduction}
          </p>
          <p className={styles.elder} data-enter>
            {content.invitee.elder}
          </p>
          <Flourish className={styles.closingDivider} />
          <div className={styles.hosts} data-enter>
            {content.invitee.hosts.map((host) => (
              <p key={host}>{host}</p>
            ))}
          </div>
          <Flourish className={styles.closingDivider} />
          <p className={styles.signOff} data-enter>
            {content.invitee.signOff}
          </p>
          <span className={styles.closingOrnament} data-enter aria-hidden="true">
            <RoyalMark />
          </span>
        </div>
        <footer className={styles.creatorCredit} aria-label="Invitation creator">
          <p>Crafted with <span aria-label="love">♥</span> by <strong>{royalCreator.name}</strong></p>
          <a href={royalCreator.telephone}>{royalCreator.phone}</a>
        </footer>
      </section>
    </div>
  );
  const ordered = Children.toArray(body.props.children).map(child => {
    if (!isValidElement<Record<string, unknown>>(child)) return null;
    const id = child.type === DateScene ? "date" : child.type === EventsSequence ? "events" : String(child.props["data-section"] || child.props["data-body-section"] || "");
    return { child, id };
  }).filter((item): item is NonNullable<typeof item> => !!item && sections.includes(item.id))
    .sort((a,b) => sections.indexOf(a.id) - sections.indexOf(b.id));
  return cloneElement(body, {}, ordered.map(item => item.child));
}
