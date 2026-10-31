"use client";
import { useState } from "react";
export function MediaUpload({ invitationId, onUpload }: { invitationId?: string; onUpload?: (url: string) => void }) {
  const [busy,setBusy] = useState(false); const [message,setMessage] = useState("");
  return <div className="media-upload"><label>Upload image or MP3<input type="file" accept="image/png,image/jpeg,image/webp,audio/mpeg" disabled={busy} onChange={async event => {
    const file = event.target.files?.[0]; if (!file) return;
    const data = new FormData(); data.set("file",file); if (invitationId) data.set("invitationId",invitationId);
    setBusy(true);setMessage("");
    try { const response = await fetch("/api/media",{method:"POST",headers:{"X-CSRF-Protection":"1"},body:data}); const result=await response.json(); if(!response.ok)throw new Error(result.error);setMessage(`Uploaded: ${result.url}`);if(result.mime.startsWith("image/"))onUpload?.(result.url); }
    catch(error){setMessage((error as Error).message);}finally{setBusy(false);}
  }}/></label><p role="status" className="muted">{busy?"Validating and storing…":message||"PNG, JPEG, WebP or MP3 · 10 MB maximum. Images are optimized and metadata is removed."}</p></div>;
}
