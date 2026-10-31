"use client";

import { useState } from "react";
import { RoyalOpening } from "./opening/royal-opening";
import type { OpeningPhase } from "./opening/config";
import { RoyalWeddingBody } from "./invitation";
import { royalWeddingDemo } from "./content";
import styles from "./full-page-preview.module.css";

export function FullPageRoyalPreview() {
  const [phase, setPhase] = useState<OpeningPhase>("loading");
  const [revision, setRevision] = useState(0);
  function replay() {
    setPhase("loading");
    setRevision((value) => value + 1);
  }
  return (
    <main
      id="main-content"
      className={styles.fullPage}
      aria-label="Royal Wedding full-page preview"
    >
      <RoyalOpening key={revision} onPhaseChange={setPhase} onRetry={replay}>
        <RoyalWeddingBody
          content={royalWeddingDemo}
          active={phase === "complete"}
          mode="admin-review"
        />
      </RoyalOpening>
    </main>
  );
}
