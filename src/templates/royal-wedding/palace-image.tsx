"use client";
import { palaceArtwork } from "./design";
import styles from "./invitation.module.css";
import { usePalaceArtwork } from "./artwork-context";

export function PalaceImage({
  scene,
  eager = false,
  prepared = true,
}: {
  scene: keyof typeof palaceArtwork;
  eager?: boolean;
  prepared?: boolean;
}) {
  const art = usePalaceArtwork(scene);
  return (
    <picture className={styles.palacePicture}>
      <source media="(max-width: 600px)" srcSet={prepared ? art.mobile : undefined} />
      {/* Local pre-optimized artwork; picture selects the deliberate mobile crop. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={prepared ? art.src : undefined}
        alt=""
        width={scene === "hero" ? 1200 : 800}
        height={scene === "hero" ? 1800 : 1000}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "auto"}
        decoding="async"
        style={{ objectPosition: art.position }}
        onLoad={event => { event.currentTarget.style.visibility = ""; }}
        onError={(event) => {
          event.currentTarget.style.visibility = "hidden";
        }}
      />
    </picture>
  );
}
