"use client";
import type { RoyalWeddingContent } from "@/templates/royal-wedding/content";
import { MediaUpload } from "./media-upload";

export function ContentFields({ content, onChange, customer = false, invitationId }: { content: RoyalWeddingContent; onChange: (next: RoyalWeddingContent) => void; customer?: boolean; invitationId?: string }) {
  function input(key: keyof RoyalWeddingContent, label: string, max: number, type = "text") {
    return <label key={key}>{label}<input type={type} value={String(content[key])} maxLength={max} required onChange={event => {
      const value = event.target.value;
      onChange({ ...content, [key]: value, ...(key === "weddingDate" ? { weddingStartsAt: `${value}${content.weddingStartsAt.slice(10)}` } : {}) });
    }} /></label>;
  }
  return <div className="business-form">
    {!customer && <fieldset><legend>The couple and family</legend><div className="business-columns">
      {input("partnerOne", "Groom / partner one", 100)}{input("partnerTwo", "Bride / partner two", 100)}
      {input("partnerOneParents", "Partner one's parents", 200)}{input("partnerTwoParents", "Partner two's parents", 200)}
    </div>{input("invitationLead", "Invitation lead-in", 200)}{input("family", "Family name", 200)}</fieldset>}
    <fieldset><legend>Invitation details</legend>{input("weddingDate", "Main wedding date", 10, "date")}
      <p className="muted">Changing this date keeps the configured ceremony time and does not change individual event dates.</p>
      {!customer && <>{input("weddingStartsAt", "Countdown start (ISO timestamp with offset)", 40)}{input("venue", "Main venue", 250)}{input("dateMessage", "Date section heading", 100)}</>}
      <label>Invitation message <span className="muted">({content.message.length}/1000)</span><textarea rows={5} value={content.message} maxLength={1000} required onChange={event => onChange({ ...content, message: event.target.value })} /></label>
    </fieldset>
    {!customer && <fieldset><legend>Ceremonies</legend><p className="muted">Keep only the ceremonies included in this invitation.</p>{content.ceremonies.map((ceremony, index) => <details key={ceremony.id} className="business-details"><summary>{ceremony.name}</summary>
      <MediaUpload invitationId={invitationId} onUpload={url => onChange({ ...content, artworkOverrides: { ...content.artworkOverrides, [ceremony.id]: url } })} />
      <div className="business-columns">{([['name','Name',100],['description','Description',250],['date','Date',10],['time','Time',100],['venue','Venue',200],['address','Address',300],['mapUrl','Google Maps link',500]] as const).map(([key, label, max]) => <label key={key}>{label}<input value={ceremony[key]} required maxLength={max} type={key === "date" ? "date" : key === "mapUrl" ? "url" : "text"} onChange={event => onChange({ ...content, ceremonies: content.ceremonies.map((row, i) => i === index ? { ...row, [key]: event.target.value } : row) })} /></label>)}</div>
      <button type="button" className="button outline small-button" onClick={() => onChange({ ...content, ceremonies: content.ceremonies.filter((_, i) => i !== index) })}>Remove ceremony</button>
    </details>)}</fieldset>}
    {!customer && <fieldset><legend>Palace background artwork</legend><MediaUpload invitationId={invitationId} onUpload={url => onChange({ ...content, artworkOverrides: { ...content.artworkOverrides, hero: url } })} />{content.artworkOverrides?.hero && <button type="button" className="button outline small-button" onClick={() => onChange({ ...content, artworkOverrides: { ...content.artworkOverrides, hero: undefined } })}>Restore template background</button>}</fieldset>}
    <fieldset><legend>Invitee closing</legend>{([['introduction','Formal lead-in',200],['elder','Elder name',100],['signOff','Family sign-off',200]] as const).map(([key,label,max]) => <label key={key}>{label}<textarea rows={2} required value={content.invitee[key]} maxLength={max} onChange={event => onChange({ ...content, invitee: { ...content.invitee, [key]: event.target.value } })} /></label>)}
      <label>Hosts (one name or couple per line, up to six)<textarea rows={4} value={content.invitee.hosts.join("\n")} onChange={event => onChange({ ...content, invitee: { ...content.invitee, hosts: event.target.value.split("\n") } })} /></label>
    </fieldset>
  </div>;
}
