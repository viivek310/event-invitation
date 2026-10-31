"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "./icon";

export function PreviewStudio({
  templateId,
  name,
}: {
  templateId: string;
  name: string;
}) {
  const [device, setDevice] = useState("desktop");
  const [copyMessage, setCopyMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/templates/${templateId}`,
      );
      setCopyMessage("Preview link copied");
    } catch {
      setCopyMessage(
        "Copy the address from your browser to share this preview.",
      );
    }
  }

  return (
    <div className="preview-studio">
      <header className="preview-toolbar">
        <div className="preview-toolbar-start">
          <Link
            className="preview-back"
            href="/templates"
            aria-label="Back to invitations"
          >
            ←
          </Link>
          <div>
            <strong>{name}</strong>
            <span>
              Invitation preview <span aria-hidden="true">·</span> Sample
              details
            </span>
          </div>
        </div>
        <div className="device-switch" aria-label="Preview size">
          <button
            type="button"
            aria-pressed={device === "desktop"}
            className={device === "desktop" ? "active" : ""}
            onClick={() => setDevice("desktop")}
            aria-label="Desktop preview"
          >
            <Icon name="monitor" size={18} />
          </button>
          <button
            type="button"
            aria-pressed={device === "mobile"}
            className={device === "mobile" ? "active" : ""}
            onClick={() => setDevice("mobile")}
            aria-label="Mobile preview"
          >
            <Icon name="phone" size={18} />
          </button>
        </div>
        <button
          type="button"
          className="button primary small-button"
          onClick={copyLink}
        >
          <Icon name="copy" size={15} />
          <span>Copy preview link</span>
        </button>
        <Link className="button outline small-button" href="/contact">Choose this template</Link>
      </header>
      <main
        id="main-content"
        className={`preview-stage ${device}`}
        aria-busy={loading}
      >
        {loading && (
          <div className="preview-loading" role="status">
            <span className="loading-spinner" /> Opening your invitation…
          </div>
        )}
        <iframe
          key={templateId}
          src={`/templates/${templateId}?canvas=1`}
          title={`${name} invitation with fictional bride and groom names`}
          className="preview-frame"
          onLoad={() => setLoading(false)}
        />
      </main>
      <div className="preview-statusbar">
        <span>
          <span className="status-dot" /> Invitation with fictional names and
          details
        </span>
        <span role="status">{copyMessage || "Preview only"}</span>
      </div>
    </div>
  );
}
