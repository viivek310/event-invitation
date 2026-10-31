"use client";
import { useEffect, useState, useRef } from "react";
import type { RoyalWeddingContent } from "@/templates/royal-wedding/content";
import { ContentFields } from "./content-fields";
import { studioRequest, MutationForm, money, effectiveState } from "./business-ui";
import { ResponseManager } from "./response-manager";

type Invitation = { id: string; slug: string; state: string; expiresAt: string | null; publishedAt?: string | null;
  draft: RoyalWeddingContent; revision: number; publishedRevision: number | null; sections?: string[];
  rsvpEnabled: boolean; rsvpDeadline?: string | null; partyLimit?: number; dietaryEnabled?: boolean; accommodationEnabled?: boolean };
const labels: Record<string,string> = { opening: "Envelope opening", ganesha: "Ganeshji", invitation: "Main invitation", date: "Wedding date", events: "Ceremonies", rsvp: "RSVP", invitee: "Family closing" };
const val = (form: FormData, name: string) => String(form.get(name) ?? "");

export function InvitationEditor({ id, customer = false }: { id: string; customer?: boolean }) {
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [content, setContent] = useState<RoyalWeddingContent | null>(null);
  const [sections, setSections] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  const requestKey = useRef("");
  const [sales, setSales] = useState<{ id: string; total: number; cash: number; createdAt: string }[]>([]);
  async function load() {
    try { const result = await studioRequest(`invitations/${id}`); setInvitation(result.invitation); setContent(result.invitation.draft); setSections(result.invitation.sections || []); setSales(result.sales || []); setDirty(false); }
    catch(e) { setError((e as Error).message); }
  }
  useEffect(() => { void load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!invitation || !content) return <section className="panel padded-panel"><p role={error ? "alert" : "status"}>{error || "Loading invitation…"}</p></section>;
  const current = invitation;
  const active = effectiveState(current) === "ACTIVE";
  const base = customer ? "/dashboard" : "/admin";
  return <div className="business-workspace"><a href={base}>← Back to workspace</a><header className="business-heading"><div><p className="eyebrow">Invitation details</p><h1>{current.draft.partnerOne} &amp; {current.draft.partnerTwo}</h1><p>/invite/{current.slug} · Valid until {current.expiresAt ? new Date(current.expiresAt).toLocaleDateString("en-IN") : "activation"}</p></div><span className={`tag ${active ? "green" : "warm"}`}>{effectiveState(current)}</span></header>
    {error && <p className="form-error" role="alert">{error}</p>}{message && <p className="form-success" role="status">{message}</p>}
    <section className="panel padded-panel"><div className="business-actions"><a className="button outline" href={`${base}/invitations/${id}/preview`} target="_blank" rel="noopener noreferrer">Preview saved draft ↗</a>{active && <><a className="button outline" href={`/invite/${current.slug}`} target="_blank" rel="noopener noreferrer">Open live invitation ↗</a><button className="button outline" onClick={async () => { try { await navigator.clipboard.writeText(`${location.origin}/invite/${current.slug}`); setMessage("Invitation link copied."); } catch { setMessage(`Copy this link: ${location.origin}/invite/${current.slug}`); } }}>Copy live link</button></>}
      <button className="button primary" disabled={!active || dirty || current.publishedRevision === current.revision} onClick={async () => { try { await studioRequest(`invitations/${id}/publish`, { revision: current.revision }); await load(); setMessage("Your saved revision is now live."); } catch(e) { setError((e as Error).message); } }}>Publish saved changes</button></div><p className="muted">Save a draft, preview it, then publish. Unsaved edits never change the public invitation.</p></section>
    <section className="panel padded-panel"><h2>{customer ? "Personalize your invitation" : "Content and sections"}</h2><MutationForm label="Save draft" submit={async form => {
      const features = { sections, rsvpEnabled: sections.includes("rsvp"), partyLimit: Number(val(form,"partyLimit")), rsvpDeadline: val(form,"rsvpDeadline") ? new Date(val(form,"rsvpDeadline")).toISOString() : "", dietaryEnabled: form.has("dietaryEnabled"), accommodationEnabled: form.has("accommodationEnabled") };
      const result = await studioRequest(`invitations/${id}/draft`, { revision: current.revision, content, ...(!customer ? { slug: val(form,"slug"), features } : {}) });
      setInvitation({ ...current, revision: result.revision, draft: content, ...(!customer ? { slug: val(form,"slug"), rsvpEnabled: features.rsvpEnabled, sections } : {}) }); setDirty(false);
    }}><ContentFields content={content} invitationId={id} customer={customer} onChange={next => { setContent(next); setDirty(true); }} />
    {!customer && <fieldset><legend>Order settings</legend><label>Link slug<input name="slug" defaultValue={current.slug} readOnly={!!current.publishedAt} required onChange={() => setDirty(true)} /></label><div className="section-order">{Object.entries(labels).map(([key,label]) => <label className="business-check" key={key}><input type="checkbox" checked={sections.includes(key)} onChange={event => { setSections(event.target.checked ? [...sections,key] : sections.filter(value => value !== key)); setDirty(true); }} />{label}</label>)}</div><p className="muted">Envelope and Ganeshji appear before the body. Move enabled body sections into your preferred order.</p><ol className="section-order-list">{sections.filter(key => !["opening","ganesha"].includes(key)).map((key,index,array) => <li key={key}><span>{labels[key]}</span><div><button type="button" aria-label={`Move ${labels[key]} up`} disabled={index === 0} onClick={() => { const ordered = [...array]; [ordered[index-1],ordered[index]] = [ordered[index],ordered[index-1]]; setSections([...sections.filter(value => ["opening","ganesha"].includes(value)),...ordered]); setDirty(true); }}>↑</button><button type="button" aria-label={`Move ${labels[key]} down`} disabled={index === array.length-1} onClick={() => { const ordered = [...array]; [ordered[index+1],ordered[index]] = [ordered[index],ordered[index+1]]; setSections([...sections.filter(value => ["opening","ganesha"].includes(value)),...ordered]); setDirty(true); }}>↓</button></div></li>)}</ol><div className="business-columns"><label>Maximum party size<input type="number" name="partyLimit" min={1} max={100} defaultValue={current.partyLimit || 6} /></label><label>RSVP deadline<input type="datetime-local" name="rsvpDeadline" defaultValue={current.rsvpDeadline?.slice(0,16) || ""} /></label></div><label className="business-check"><input type="checkbox" name="dietaryEnabled" defaultChecked={current.dietaryEnabled} /> Collect dietary preferences</label><label className="business-check"><input type="checkbox" name="accommodationEnabled" defaultChecked={current.accommodationEnabled} /> Collect accommodation preferences</label></fieldset>}
    </MutationForm></section>
    {!customer && <><section className="panel padded-panel"><h2>Cash sale and manual activation</h2><p>Record the exact full payment after discounts, or explicitly confirm a complimentary order.</p><MutationForm label={current.publishedAt ? "Record renewal and activate" : "Record cash and activate"} submit={async form => {
      requestKey.current ||= crypto.randomUUID();
      await studioRequest(`invitations/${id}/activate`, { requestKey: requestKey.current, originalPrice: Math.round(Number(val(form,"price"))*100), cash: Math.round(Number(val(form,"cash"))*100), couponCode: val(form,"coupon"), complimentary: form.has("complimentary"), cashConfirmed: form.has("cashConfirmed"), paidAt: new Date(val(form,"paidAt")).toISOString(), expiresAt: new Date(val(form,"expiresAt")).toISOString(), notes: val(form,"notes") });
      requestKey.current = ""; await load(); setMessage("Sale recorded and invitation activated.");
    }}><div className="business-columns"><label>Original price (₹)<input name="price" type="number" required min="0" step="0.01" /></label><label>Cash received (₹)<input name="cash" type="number" required min="0" step="0.01" /></label><label>Coupon code<input name="coupon" maxLength={40} /></label><label>Payment date<input type="datetime-local" name="paidAt" required /></label><label>Valid until<input type="datetime-local" name="expiresAt" required /></label></div><label>Internal notes<textarea name="notes" maxLength={2000} /></label><label className="business-check"><input type="checkbox" name="complimentary" /> Explicit complimentary activation (zero-total orders only)</label><label className="business-check"><input type="checkbox" name="cashConfirmed" required /> I confirm the cash received or complimentary activation</label></MutationForm></section>
    <section className="panel padded-panel"><h2>Availability</h2><div className="business-actions">{["SUSPENDED","ACTIVE","ARCHIVED"].map(state => <button key={state} className="button outline" onClick={async () => { if (!confirm(`${state === "ACTIVE" ? "Restore" : state === "SUSPENDED" ? "Suspend" : "Archive"} this invitation?`)) return; try { await studioRequest(`invitations/${id}/status`, { state }); await load(); } catch(e) { setError((e as Error).message); } }}>{state === "ACTIVE" ? "Restore active link" : state === "SUSPENDED" ? "Suspend public link" : "Archive"}</button>)}</div></section>
    {sales.length > 0 && <section className="panel padded-panel"><h2>Sales history</h2>{sales.map(sale => <div className="business-list-row" key={sale.id}><time>{new Date(sale.createdAt).toLocaleDateString("en-IN")}</time><span>Total {money(sale.total)} · Cash {money(sale.cash)}</span></div>)}</section>}
    </>}
    {current.rsvpEnabled && <ResponseManager invitationId={id} content={current.draft} />}
  </div>;
}
