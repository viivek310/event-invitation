"use client";
import { useState } from "react";
import type { FormEvent } from "react";
import type { TemplateDefinition, InvitationContent } from "@/templates/types";
import { templateRenderers } from "@/templates/renderers";

export function TemplateSandbox({
  template,
}: {
  template: TemplateDefinition;
}) {
  const [content, setContent] = useState<InvitationContent>({
    ...template.demo,
  });
  const [revision, setRevision] = useState(0);
  const [message, setMessage] = useState("");
  const Renderer = templateRenderers[template.id];
  if (!Renderer) return null;

  function preview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setContent({
      partnerOne: String(form.get("partnerOne")).trim(),
      partnerTwo: String(form.get("partnerTwo")).trim(),
      weddingDate: String(form.get("weddingDate")),
      venue: String(form.get("venue")).trim(),
      message: String(form.get("message")).trim(),
      family: String(form.get("family")).trim(),
    });
    setMessage("Preview updated in this tab. Nothing has been saved.");
  }

  function reset() {
    setContent({ ...template.demo });
    setRevision((value) => value + 1);
    setMessage("Restored the template's example details.");
  }

  return (
    <div className="sandbox-grid">
      <section className="panel padded-panel">
        <h2>Try different details</h2>
        <p className="small">
          This is a temporary visual preview. Refreshing or leaving this page
          resets it. The public preview stays unchanged.
        </p>
        <form className="content-form" onSubmit={preview} key={revision}>
          <div className="form-columns">
            <label>
              Groom’s name
              <input
                required
                name="partnerOne"
                maxLength={80}
                defaultValue={template.demo.partnerOne}
              />
            </label>
            <label>
              Bride’s name
              <input
                required
                name="partnerTwo"
                maxLength={80}
                defaultValue={template.demo.partnerTwo}
              />
            </label>
          </div>
          <label>
            Wedding date
            <input
              required
              name="weddingDate"
              type="date"
              defaultValue={template.demo.weddingDate}
            />
          </label>
          <label>
            Venue
            <input
              required
              name="venue"
              maxLength={300}
              defaultValue={template.demo.venue}
            />
          </label>
          <label>
            Invitation message
            <textarea
              required
              name="message"
              rows={4}
              maxLength={2000}
              defaultValue={template.demo.message}
            />
          </label>
          <label>
            Family sign-off
            <input
              required
              name="family"
              maxLength={300}
              defaultValue={template.demo.family}
            />
          </label>
          <div className="button-row">
            <button className="button primary" type="submit">
              Update preview
            </button>
            <button className="button outline" type="button" onClick={reset}>
              Reset
            </button>
          </div>
          <p className="form-status small" role="status">
            {message || "Preview only · no storage connected"}
          </p>
        </form>
      </section>
      <section className="sandbox-preview" aria-label="Invitation preview" data-royal-embedded>
        <div className="sandbox-caption">
          <span className="status-dot" /> Same template · sample content
        </div>
        <Renderer content={content} mode="sandbox" />
      </section>
    </div>
  );
}
