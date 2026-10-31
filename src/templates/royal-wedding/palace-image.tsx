"use client";
import { palaceArtwork } from "./design";
import styles from "./invitation.module.css";
import { usePalaceArtwork } from "./artwork-context";

export function PalaceImage({
  scene,
  eager = false,
}: {
  scene: keyof typeof palaceArtwork;
  eager?: boolean;
}) {
  const art = usePalaceArtwork(scene);
  return (
    <picture className={styles.palacePicture}>
      <source media="(max-width: 600px)" srcSet={art.mobile} />
      {/* Local pre-optimized artwork; picture selects the deliberate mobile crop. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={art.src}
        alt=""
        width={scene === "hero" ? 1200 : 800}
        height={scene === "hero" ? 1800 : 1000}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "auto"}
        decoding="async"
        style={{ objectPosition: art.position }}
        onError={(event) => {
          event.currentTarget.style.visibility = "hidden";
        }}
      />
    </picture>
  );
}
