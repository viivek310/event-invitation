"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  blessingWords,
  gujaratiBlessing,
  openingConfig,
  phaseLabels,
} from "./config";
import type { OpeningPhase } from "./config";
import { royalGujarati } from "./font";
import styles from "./opening.module.css";
import { usePalaceArtwork } from "../artwork-context";
import { royalBody, royalDisplay } from "../fonts";

type Asset = keyof typeof openingConfig.assets;
type Props = {
  onPhaseChange?: (phase: OpeningPhase) => void;
  onRetry: () => void;
  children?: ReactNode;
  openingEnabled?: boolean;
  ganeshaEnabled?: boolean;
};
const movingPhases: readonly OpeningPhase[] = [
  "flap",
  "emerging",
  "expanding",
  "ganesh",
];

export function RoyalOpening({ onPhaseChange, onRetry, children, openingEnabled = true, ganeshaEnabled = true }: Props) {
  const heroArtwork = usePalaceArtwork("hero");
  const [phase, setPhase] = useState<OpeningPhase>("loading");
  const [ganeshStep, setGaneshStep] = useState("pending");
  const [failedAssets, setFailedAssets] = useState<ReadonlySet<Asset>>(
    new Set(),
  );
  const activePhase = useRef<OpeningPhase>("loading");
  const loaded = useRef(new Set<Asset>());
  const fontPrepared = useRef(false);
  const generation = useRef(0);
  const animations = useRef(new Set<Animation>());
  const focusFrame = useRef<number | null>(null);
  const root = useRef<HTMLElement>(null);
  const rig = useRef<HTMLDivElement>(null);
  const back = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const pocket = useRef<HTMLDivElement>(null);
  const hinge = useRef<HTMLDivElement>(null);
  const flap = useRef<HTMLDivElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const deity = useRef<HTMLDivElement>(null);
  const aura = useRef<HTMLDivElement>(null);
  const ribbon = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const blessing = useRef<HTMLParagraphElement>(null);
  const prompt = useRef<HTMLDivElement>(null);

  const changePhase = useCallback(
    (next: OpeningPhase) => {
      activePhase.current = next;
      setPhase(next);
      onPhaseChange?.(next);
    },
    [onPhaseChange],
  );

  const cancelAnimations = useCallback(() => {
    generation.current += 1;
    for (const animation of animations.current) animation.cancel();
    animations.current.clear();
  }, []);

  const complete = useCallback(() => {
    cancelAnimations();
    // Apply the final responsive pose immediately, even if skipping halfway through.
    root.current?.setAttribute("data-phase", "complete");
    setGaneshStep("settled");
    for (const ref of [
      back,
      card,
      pocket,
      hinge,
      flap,
      surface,
      deity,
      aura,
      ribbon,
      blessing,
      prompt,
    ]) {
      ref.current?.removeAttribute("style");
    }
    for (const word of wordRefs.current) word?.removeAttribute("style");
    changePhase("complete");
    if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current);
    focusFrame.current = requestAnimationFrame(() =>
      blessing.current?.focus({ preventScroll: true }),
    );
  }, [cancelAnimations, changePhase]);

  useEffect(() => {
    let disposed = false;
    async function prepareFont() {
      try {
        const palaceImage = new window.Image();
        palaceImage.src = heroArtwork.src;
        await Promise.allSettled([
          palaceImage.decode(),
          document.fonts.load(
            `600 48px ${royalDisplay.style.fontFamily}`,
            "Aarav Meera",
          ),
          document.fonts.load(
            `400 12px ${royalBody.style.fontFamily}`,
            "Together with our families",
          ),
          document.fonts.load(
            `500 18px ${royalGujarati.style.fontFamily}`,
            gujaratiBlessing,
          ),
        ]);
      } catch {
        // The local fallback can still shape Gujarati if the font file cannot load.
      }
      if (disposed) return;
      fontPrepared.current = true;
      if (loaded.current.size === 3 && activePhase.current === "loading")
        changePhase("ready");
    }
    void prepareFont();
    return () => {
      disposed = true;
    };
  }, [changePhase, heroArtwork.src]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reduce = () => {
      if (media.matches && movingPhases.includes(activePhase.current))
        complete();
    };
    media.addEventListener("change", reduce);
    let previous = root.current?.getBoundingClientRect();
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (
        previous &&
        (Math.abs(previous.width - width) > 2 ||
          Math.abs(previous.height - height) > 2) &&
        movingPhases.includes(activePhase.current)
      )
        complete();
      previous = { width, height } as DOMRect;
    });
    if (root.current) observer.observe(root.current);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", reduce);
      cancelAnimations();
      if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current);
    };
  }, [cancelAnimations, complete]);

  function assetLoaded(asset: Asset) {
    loaded.current.add(asset);
    if (
      loaded.current.size === 3 &&
      fontPrepared.current &&
      activePhase.current === "loading"
    )
      changePhase("ready");
  }

  function assetFailed(asset: Asset) {
    setFailedAssets((current) => new Set([...current, asset]));
    if (activePhase.current !== "complete") {
      cancelAnimations();
      changePhase("error");
    }
  }

  useEffect(() => {
    if (phase === "ready" && !openingEnabled) void open();
  }, [phase, openingEnabled]); // eslint-disable-line react-hooks/exhaustive-deps

  async function open() {
    if (activePhase.current !== "ready") return;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !Element.prototype.animate
    ) {
      complete();
      return;
    }
    const run = ++generation.current;
    const nodes = {
      root: root.current!,
      rig: rig.current!,
      card: card.current!,
      flap: flap.current!,
      hinge: hinge.current!,
      pocket: pocket.current!,
      back: back.current!,
      surface: surface.current!,
      deity: deity.current!,
      aura: aura.current!,
      ribbon: ribbon.current!,
      blessing: blessing.current!,
      prompt: prompt.current!,
    };
    const stageBounds = nodes.root.getBoundingClientRect();
    const rigBounds = nodes.rig.getBoundingClientRect();
    const cardBounds = nodes.card.getBoundingClientRect();
    const lift = rigBounds.height * 0.12;
    const exit = rigBounds.height * 0.86;
    const d = openingConfig.duration;
    const ease = "cubic-bezier(.45, 0, .2, 1)";

    async function play(
      element: HTMLElement,
      frames: Keyframe[],
      duration: number,
      easing = ease,
      delay = 0,
    ) {
      if (generation.current !== run)
        throw new DOMException("Cancelled", "AbortError");
      const animation = element.animate(frames, {
        duration,
        easing,
        fill: "forwards",
        delay,
      });
      animations.current.add(animation);
      try {
        await animation.finished;
        if (generation.current !== run || !element.isConnected)
          throw new DOMException("Cancelled", "AbortError");
        // Commit only this animation's properties; cancel its retained compositor layer.
        const final = frames[frames.length - 1];
        for (const [property, value] of Object.entries(final)) {
          if (["offset", "easing", "composite"].includes(property)) continue;
          element.style.setProperty(
            property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`),
            String(value),
          );
        }
      } finally {
        animation.cancel();
        animations.current.delete(animation);
      }
    }

    try {
      if (openingEnabled) {
      changePhase("flap");
      await Promise.all([
        play(nodes.prompt, [{ opacity: 1 }, { opacity: 0 }], 220),
        play(
          nodes.flap,
          [{ transform: "rotateX(0deg)" }, { transform: "rotateX(90deg)" }],
          d.flapHalf,
        ),
      ]);
      // Swap the layer only when the flap is edge-on to avoid visible popping.
      nodes.hinge.style.zIndex = "10";
      await play(
        nodes.flap,
        [{ transform: "rotateX(90deg)" }, { transform: "rotateX(180deg)" }],
        d.flapHalf,
      );

      changePhase("emerging");
      await play(
        nodes.card,
        [
          { transform: "translateY(0px)" },
          { transform: `translateY(${-lift}px)` },
        ],
        d.emerge,
      );

      changePhase("expanding");
      await Promise.all([
        play(
          nodes.card,
          [
            {
              transform: `translateY(${-lift}px) scale(1, 1)`,
              borderRadius: "10px",
            },
            {
              transform: `translateY(0px) scale(${stageBounds.width / cardBounds.width}, ${stageBounds.height / cardBounds.height})`,
              borderRadius: "0px",
            },
          ],
          d.expand,
        ),
        play(nodes.surface, [{ opacity: 0 }, { opacity: 1 }], d.expand),
        ...[nodes.pocket, nodes.back, nodes.hinge].map((node) =>
          play(
            node,
            [
              { transform: "translateY(0px)", opacity: 1 },
              { transform: `translateY(${exit}px)`, opacity: 0 },
            ],
            d.expand * 0.8,
          ),
        ),
      ]);

      }
      if (!ganeshaEnabled) { complete(); return; }

      // The deity is already in its real, normal-flow header position. Measure
      // that pose and animate from the canvas center into it (FLIP), not a
      // percentage-based endpoint that would jump when the header takes over.
      const target = nodes.deity.getBoundingClientRect();
      // The outer page may have scrolled while the envelope opened. Use the
      // current canvas position so Ganeshji starts at its exact visible center.
      const currentStage = nodes.root.getBoundingClientRect();
      const x =
        currentStage.left +
        currentStage.width / 2 -
        (target.left + target.width / 2);
      const y =
        currentStage.top +
        currentStage.height / 2 -
        (target.top + target.height / 2);
      const scale = Math.min(
        3.2,
        (currentStage.width * 0.78) / target.width,
        (currentStage.height * 0.45) / target.height,
      );
      const centralPose = `translate(${x}px, ${y}px) scale(${scale})`;
      nodes.deity.style.transform = centralPose;
      setGaneshStep("center");
      changePhase("ganesh");
      await Promise.all([
        play(
          nodes.deity,
          [
            {
              opacity: 0,
              transform: centralPose,
            },
            { opacity: 1, transform: centralPose },
          ],
          d.ganeshReveal,
          "cubic-bezier(.16, 1, .3, 1)",
        ),
        play(
          nodes.aura,
          [
            { opacity: 0, transform: "scale(.9)" },
            { opacity: 0.9, transform: "scale(1)" },
          ],
          d.ganeshReveal,
        ),
      ]);
      await play(
        nodes.deity,
        [{ opacity: 1 }, { opacity: 1 }],
        d.ganeshHold,
        "linear",
      );
      setGaneshStep("rising");
      const textStart = d.ganeshMove;
      await Promise.all([
        play(
          nodes.deity,
          [
            { transform: centralPose },
            { transform: "translate(0px, 0px) scale(1)" },
          ],
          d.ganeshMove,
          "cubic-bezier(.65, 0, .25, 1)",
        ),
        play(
          nodes.aura,
          [
            { opacity: 0.9, transform: "scale(1)" },
            { opacity: 0, transform: "scale(.8)" },
          ],
          d.ganeshMove * 0.75,
        ),
        play(
          nodes.ribbon,
          [
            { opacity: 0, transform: "translateY(8px) scale(.97)" },
            { opacity: 1, transform: "translateY(0px) scale(1)" },
          ],
          d.blessingRibbon,
          "cubic-bezier(.16, 1, .3, 1)",
          d.ganeshMove,
        ),
        ...wordRefs.current
          .filter((word): word is HTMLSpanElement => !!word)
          .map((word, index) =>
            play(
              word,
              [
                {
                  opacity: 0,
                  transform: "translateY(7px)",
                  filter: "blur(3px)",
                },
                {
                  opacity: 1,
                  transform: "translateY(0px)",
                  filter: "blur(0px)",
                },
              ],
              d.blessingWord,
              "cubic-bezier(.16, 1, .3, 1)",
              textStart + index * d.blessingStagger,
            ),
          ),
      ]);
      if (generation.current === run) complete();
    } catch (error) {
      if (generation.current === run) {
        console.warn(
          "Opening animation could not finish; showing the blessing.",
          error instanceof Error ? error.name : "AnimationError",
        );
        complete();
      }
    }
  }

  const busy = phase === "loading" || movingPhases.includes(phase);
  const theme = Object.fromEntries(
    Object.entries(openingConfig.colors).map(([key, value]) => [
      `--royal-${key}`,
      value,
    ]),
  ) as CSSProperties;
  (theme as Record<string, string>)["--royal-palace-image"] =
    `url("${heroArtwork.src}")`;
  const imageEvents = (asset: Asset) => ({
    onLoad: () => assetLoaded(asset),
    onError: () => assetFailed(asset),
  });

  return (
    <section
      ref={root}
      className={styles.stage}
      style={theme}
      data-phase={phase}
      data-ganesh-step={ganeshStep}
      data-royal-scroll
      aria-label="Royal Wedding opening animation"
      aria-busy={busy}
    >
      <div className={styles.ambient} aria-hidden="true">
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            style={{
              left: `${(i * 37 + 13) % 100}%`,
              top: `${(i * 23 + 17) % 100}%`,
              animationDelay: `${-i * 0.7}s`,
            }}
          />
        ))}
      </div>
      <div ref={surface} className={styles.surface} />
      <div ref={rig} className={styles.rig}>
        <div ref={back} className={styles.envelopeBack} aria-hidden="true" />
        <div ref={card} className={styles.card} aria-hidden="true">
          <div className={styles.cardBorder} />
          <span className={styles.cardMotif}>✦</span>
        </div>
        <div ref={pocket} className={styles.pocket} aria-hidden="true">
          <Image
            src={openingConfig.assets.pocket}
            alt=""
            fill
            sizes="100vw"
            loading="eager"
            unoptimized
            {...imageEvents("pocket")}
          />
        </div>
        <div ref={hinge} className={styles.hinge}>
          <div ref={flap} className={styles.flap}>
            <Image
              src={openingConfig.assets.flap}
              alt=""
              fill
              sizes="100vw"
              loading="eager"
              unoptimized
              {...imageEvents("flap")}
            />
            <button
              type="button"
              className={styles.sealButton}
              aria-label="Open invitation"
              aria-describedby="royal-opening-hint"
              onClick={open}
              disabled={phase !== "ready"}
              style={{
                left: `${openingConfig.seal.x}%`,
                top: `${openingConfig.seal.y}%`,
                width: `${openingConfig.seal.width}%`,
                height: `${openingConfig.seal.height}%`,
              }}
            />
          </div>
        </div>
      </div>
      <div
        className={styles.invitationFlow}
        aria-hidden={phase !== "ganesh" && phase !== "complete"}
      >
        <div
          className={styles.invitationBackdrop}
          data-palace-backdrop
          aria-hidden="true"
        />
        <header
          className={styles.ganeshHeader}
          hidden={!ganeshaEnabled}
          data-testid="royal-invitation-header"
        >
          <div ref={deity} className={styles.deity}>
            <div
              ref={aura}
              className={styles.aura}
              data-testid="ganesh-aura"
              aria-hidden="true"
            />
            {failedAssets.has("ganesh") ? (
              <span className={styles.ganeshFallback}>Ganesha</span>
            ) : (
              <Image
                src={openingConfig.assets.ganesh}
                alt="Lord Ganesha"
                fill
                sizes="220px"
                loading="eager"
                unoptimized
                {...imageEvents("ganesh")}
              />
            )}
          </div>
          <div ref={ribbon} className={styles.blessingRibbon}>
            <span className={styles.blessingOrnament} aria-hidden="true">
              ✦
            </span>
            <p
              ref={blessing}
              className={`${styles.blessing} ${royalGujarati.className}`}
              tabIndex={-1}
              lang="gu"
              aria-label={gujaratiBlessing}
            >
              {blessingWords.map((word, index) => (
                <span
                  key={index}
                  ref={(node) => {
                    wordRefs.current[index] = node;
                  }}
                  className={styles.blessingWord}
                >
                  {word}
                  {index < blessingWords.length - 1 ? " " : ""}
                </span>
              ))}
            </p>
            <span className={styles.blessingOrnament} aria-hidden="true">
              ✦
            </span>
          </div>
        </header>
        <div
          className={styles.contentSlot}
          data-testid="royal-invitation-content"
          hidden={phase !== "complete"}
        >
          {children}
        </div>
      </div>
      {phase !== "complete" && (
        <button type="button" className={styles.skip} onClick={complete}>
          {phase === "error"
            ? "Continue without animation"
            : "Skip introduction"}
          <span aria-hidden="true">→</span>
        </button>
      )}
      <div ref={prompt} className={styles.prompt} hidden={!openingEnabled}>
        <span id="royal-opening-hint" className={styles.promptHint}>Tap to open</span>
      </div>
      {phase === "loading" && (
        <div className={styles.loading} role="status">
          <span />
          Preparing your invitation
        </div>
      )}
      {phase === "error" && (
        <div className={styles.error} role="alert">
          <h2>The opening artwork couldn’t load.</h2>
          <p>You can retry or continue to the blessing.</p>
          <button type="button" onClick={onRetry}>
            Retry artwork
          </button>
        </div>
      )}
      <span className={styles.accessibleStatus} role="status">
        {phaseLabels[phase]}
      </span>
    </section>
  );
}
