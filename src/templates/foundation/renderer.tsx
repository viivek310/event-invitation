import type { TemplateProps } from "../types";

export default function FoundationPreview({ content }: TemplateProps) {
  const parsedDate = new Date(`${content.weddingDate}T12:00:00Z`);
  const date = Number.isNaN(parsedDate.getTime())
    ? "Date to be confirmed"
    : new Intl.DateTimeFormat("en", {
        dateStyle: "long",
        timeZone: "UTC",
      }).format(parsedDate);

  return (
    <article className="sample-invitation" aria-label="Sample invitation">
      <div className="sample-card">
        <span className="ornament" aria-hidden="true">
          ✧
        </span>
        <p className="eyebrow">Together with their families</p>
        <h1 className="sample-names">
          {content.partnerOne}
          <span>&</span>
          {content.partnerTwo}
        </h1>
        <div className="fine-rule" />
        <p className="sample-message">{content.message}</p>
        <p className="eyebrow">Save the date</p>
        <h2 className="sample-date">{date}</h2>
        <p className="sample-venue">{content.venue}</p>
        <div className="fine-rule" />
        <p className="sample-family">
          With love,
          <br />
          {content.family}
        </p>
        <span className="ornament" aria-hidden="true">
          ✧
        </span>
      </div>
    </article>
  );
}
