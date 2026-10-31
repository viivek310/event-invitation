"use client";
import { createContext, useContext } from "react";
import type { RoyalWeddingContent } from "./content";
import { palaceArtwork } from "./design";
export const ArtworkContext = createContext<RoyalWeddingContent["artworkOverrides"]>(undefined);
export function usePalaceArtwork(scene: keyof typeof palaceArtwork) {
  const override = useContext(ArtworkContext)?.[scene];
  return override ? { src: override, mobile: override, position: "50% 50%" } : palaceArtwork[scene];
}
