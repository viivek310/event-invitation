"use client";
import { useState } from "react";

export async function studioRequest(path: string, data?: unknown) {
  const response = await fetch(`/api/studio/${path}`, { method: data === undefined ? "GET" : "POST", cache: "no-store",
    headers: { "Content-Type": "application/json", "X-CSRF-Protection": "1" }, ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
  const result = await response.json();
  if (response.status === 401) { window.location.assign("/login"); throw new Error("Please sign in."); }
  if (!response.ok) throw new Error(result.error || "Unable to complete request.");
  return result;
}
export function SignOut() {
  return <button className="button outline small-button" onClick={async () => {
    await fetch("/api/auth/logout", { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Protection": "1" }, body: "{}" });
    window.location.assign("/login");
  }}>Sign out</button>;
}
export const money = (paise: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(paise / 100);
export function effectiveState(invitation: { state: string; expiresAt: string | null }) {
  return invitation.state === "ACTIVE" && invitation.expiresAt && new Date(invitation.expiresAt) <= new Date() ? "EXPIRED" : invitation.state;
}
export function MutationForm({ children, submit, label = "Save", onSuccess }: {
  children: React.ReactNode; submit: (form: FormData) => Promise<unknown>; label?: string; onSuccess?: (result: unknown) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  return <form className="business-form" onSubmit={async event => {
    event.preventDefault(); if (busy) return;
    const data = new FormData(event.currentTarget);
    setBusy(true); setMessage(""); setFailed(false);
    try { const result = await submit(data); setMessage("Saved successfully."); onSuccess?.(result); }
    catch (error) { setFailed(true); setMessage(error instanceof Error ? error.message : "Unable to complete request."); }
    finally { setBusy(false); }
  }}>{children}{message && <p role={failed ? "alert" : "status"} className={failed ? "form-error" : "form-success"}>{message}</p>}
    <button className="button primary" disabled={busy}>{busy ? "Saving…" : label}</button></form>;
}
