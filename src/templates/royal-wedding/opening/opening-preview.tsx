"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { RoyalOpening } from "./royal-opening";
import { phaseLabels } from "./config";
import type { OpeningPhase } from "./config";
import styles from "./preview.module.css";
import { RoyalWeddingBody } from "../invitation";
import { royalWeddingDemo } from "../content";
const reviewSections = ["invitation", "date", "events", "rsvp", "invitee"];
const reviewWithoutRsvp = reviewSections.filter(section => section !== "rsvp");

export function RoyalOpeningPreview() {
  const [revision, setRevision] = useState(0);
  const [phase, setPhase] = useState<OpeningPhase>("loading");
  const [device, setDevice] = useState("desktop");
  const [reviewRsvp, setReviewRsvp] = useState(true);
  function replay() {
    setPhase("loading");
    setRevision((value) => value + 1);
  }

  return (
    <section
      className={styles.preview}
      aria-label="In-progress Royal Wedding preview"
    >
      <header className={styles.toolbar}>
        <div>
          <span className={styles.liveDot} />
          <strong>Complete invitation</strong>
          <span className={styles.progressTag}>In progress</span>
        </div>
        <div className="device-switch" aria-label="Preview size">
          <button
            type="button"
            aria-label="Desktop preview"
            aria-pressed={device === "desktop"}
            className={device === "desktop" ? "active" : ""}
            onClick={() => setDevice("desktop")}
          >
            <Icon name="monitor" size={17} />
          </button>
          <button
            type="button"
            aria-label="Mobile preview"
            aria-pressed={device === "mobile"}
            className={device === "mobile" ? "active" : ""}
            onClick={() => setDevice("mobile")}
          >
            <Icon name="phone" size={17} />
          </button>
        </div>
        <button type="button" className={styles.replay} onClick={replay}>
          Replay <span aria-hidden="true">↻</span>
        </button>
      </header>
      <div className={styles.reviewNote}>
        <Link
          href="/preview/royal-wedding"
          target="_blank"
          className={styles.fullPageLink}
        >
          Open full-page preview ↗
        </Link>
        <label>
          <input
            type="checkbox"
            checked={reviewRsvp}
            onChange={(event) => setReviewRsvp(event.target.checked)}
          />{" "}
          Review RSVP layout
        </label>
        <span>
          {reviewRsvp
            ? "Private design review: try the RSVP fields; submission is disabled, and no responses are saved."
            : "RSVP is hidden for this design review."}
        </span>
      </div>
      <div
        data-royal-embedded
        className={`${styles.canvasArea} ${device === "mobile" ? styles.mobile : styles.desktop}`}
      >
        <div className={styles.device}>
          <RoyalOpening
            key={revision}
            onPhaseChange={setPhase}
            onRetry={replay}
          >
            <RoyalWeddingBody
              content={royalWeddingDemo}
              active={phase === "complete"}
              mode="admin-review"
              sections={reviewRsvp ? reviewSections : reviewWithoutRsvp}
            />
          </RoyalOpening>
        </div>
      </div>
      <footer className={styles.statusbar}>
        <span>
          <span className={styles.liveDot} />
          {phaseLabels[phase]}
        </span>
        <span>Opening · Invitation · Date · Events · Family</span>
      </footer>
      <p className={styles.artworkNote}>
        Burgundy embossed envelope with a plain gold seal. Tap the seal to open.
        This design uses burgundy, champagne gold, and parchment.
      </p>
    </section>
  );
}
