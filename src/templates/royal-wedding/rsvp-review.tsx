"use client";
import { useState } from "react";
import type { RoyalWeddingContent } from "./content";
import type { TemplateProps } from "../types";
import { Flourish } from "./artwork";
import styles from "./invitation.module.css";
import { RoyalCorners } from "./royal-corners";

export function RsvpReview({ content, live, demo = false }: { content: RoyalWeddingContent; live?: TemplateProps["live"]; demo?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  return (
    <section className={styles.rsvpSection} data-section="rsvp" aria-labelledby="royal-rsvp-title">
      <RoyalCorners />
      <div data-enter>
        <span className={styles.eyebrow}>Your reply</span>
        <h2 id="royal-rsvp-title">Kindly RSVP</h2>
        <p className={styles.sectionMessage}>We look forward to celebrating with you.</p>
        {demo && <p className={styles.sectionMessage}>Preview only — responses cannot be sent.</p>}
        <Flourish className={styles.flourish} />
      </div>
      {success ? <div className={styles.rsvpConfirmation} role="status"><h3>Thank you for your reply</h3><p>Your response has been received by the hosts.</p></div> : <form onSubmit={async event => {
        event.preventDefault(); if (!live || busy) return;
        const form = new FormData(event.currentTarget);
        const attending = form.get("attendance") === "attending";
        setBusy(true); setError("");
        try {
          const response = await fetch(`/api/rsvp/${live.slug}`, { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Protection": "1" },
            body: JSON.stringify({ name: form.get("guest-name"), phone: form.get("phone"), email: form.get("email") || "", attending,
              partySize: attending ? Number(form.get("party-size")) : 0, ceremonies: attending ? form.getAll("ceremonies") : [],
              dietary: form.get("dietary") || "", accommodation: form.get("accommodation") || "" }) });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || "Your response could not be saved.");
          setSuccess(true);
        } catch(e) { setError(e instanceof Error ? e.message : "Unable to send. Please try again."); }
        finally { setBusy(false); }
      }}>
      <fieldset disabled={!live || busy} className={styles.rsvpFields}>
        <legend className={styles.srOnly}>{live ? "Your RSVP" : "RSVP design review — responses are disabled"}</legend>
        <fieldset className={styles.rsvpGroup} data-enter>
          <legend>Your details</legend>
          <label>Your name<input name="guest-name" autoComplete="name" placeholder="Full name" required maxLength={120} /></label>
          <div className={styles.fieldRow}>
            <label>Phone number<input name="phone" type="tel" autoComplete="tel" placeholder="+91 …" required maxLength={40} /></label>
            <label>Email (optional)<input name="email" type="email" autoComplete="email" placeholder="Email address" /></label>
          </div>
        </fieldset>
        <fieldset className={styles.rsvpGroup} data-enter>
          <legend>Your attendance</legend>
          <div className={styles.attendanceOptions}>
            <label><input type="radio" name="attendance" value="attending" required /><span>Joyfully accept</span></label>
            <label><input type="radio" name="attendance" value="declining" /><span>Regretfully decline</span></label>
          </div>
          <label>Number of guests<input className={styles.partySize} name="party-size" type="number" defaultValue={1} min={1} max={live?.partyLimit || 100} required /></label>
        </fieldset>
        <fieldset className={`${styles.rsvpGroup} ${styles.ceremonyChoices}`} data-enter>
          <legend>Celebrations you’ll attend</legend>
          {content.ceremonies.map(event => <label key={event.id}>
            <input type="checkbox" name="ceremonies" value={event.id} />{event.name}
          </label>)}
        </fieldset>
        {(!live || live.dietaryEnabled || live.accommodationEnabled) && <fieldset className={styles.rsvpGroup} data-enter>
          <legend>Guest preferences</legend>
          {(!live || live.dietaryEnabled) && <label>Dietary preferences (optional)<textarea name="dietary" rows={2} placeholder="Anything we should know?" maxLength={500} /></label>}
          {(!live || live.accommodationEnabled) && <label>Accommodation (optional)<select name="accommodation" defaultValue="">
            <option value="">Select your preference</option><option>Assistance requested</option><option>Arranged independently</option>
          </select></label>}
        </fieldset>}
        {error && <p className={styles.rsvpError} role="alert">{error}</p>}
        <div className={styles.rsvpActions} data-enter>
          <button type={live ? "submit" : "button"} className={styles.goldButton}>{busy ? "Sending…" : "Send RSVP"} <span aria-hidden="true">↗</span></button>
        </div>
      </fieldset>
      </form>}
    </section>
  );
}
