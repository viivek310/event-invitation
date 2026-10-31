"use client";
import { useState } from "react";

export function AuthForm({ action = "login" }: { action?: string }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [setup, setSetup] = useState<{ secret: string; qr: string } | null>(null);
  const [recovery, setRecovery] = useState<string[]>([]);
  const enroll = action === "mfa-confirm";
  async function call(data: Record<string, unknown>, endpoint = action) {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/auth/${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Protection": "1" }, body: JSON.stringify(data) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (result.qr) setSetup(result);
      else if (result.recoveryCodes?.length) setRecovery(result.recoveryCodes);
      else if (result.redirect) window.location.assign(result.redirect);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to complete request."); }
    finally { setBusy(false); }
  }
  if (recovery.length) return <div><h2>Save your recovery codes</h2><p>Each code works once. Store these offline; they will not be shown again.</p><pre className="recovery-codes">{recovery.join("\n")}</pre><a className="button primary" href="/admin">I saved my codes</a></div>;
  return <form className="business-form" onSubmit={e => { e.preventDefault(); void call(Object.fromEntries(new FormData(e.currentTarget))); }}>
    {action === "login" && <><label>Mobile number<input name="phone" type="tel" autoComplete="username" placeholder="+91 …" required /></label><label>Password<input name="password" type="password" autoComplete="current-password" required maxLength={128} /></label><p className="muted">Use the credentials provided by the studio. For recovery, contact the studio directly.</p></>}
    {action === "password" && <><label>Current password<input name="current" type="password" autoComplete="current-password" required /></label><label>New password<input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></label><p className="muted">Use at least 12 characters. Changing your password signs out other sessions.</p></>}
    {enroll && !setup && <button type="button" className="button outline" disabled={busy} onClick={() => void call({}, "mfa-enroll")}>Set up authenticator app</button>}
    {setup && <div><img src={setup.qr} alt="Scan this QR code with your authenticator app" width={220} height={220} /><p>Or enter this setup key:</p><code className="secret-key">{setup.secret}</code></div>}
    {(action === "mfa-verify" || (enroll && setup)) && <label>{enroll ? "Authenticator code" : "Authenticator or recovery code"}<input name="code" autoComplete="one-time-code" required maxLength={80} /></label>}
    {error && <p role="alert" className="form-error">{error}</p>}
    {(!enroll || setup) && <button className="button primary" disabled={busy}>{busy ? "Please wait…" : action === "login" ? "Sign in" : action === "password" ? "Change password" : "Verify"}</button>}
  </form>;
}
