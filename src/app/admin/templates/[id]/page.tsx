import Link from "next/link";
import { notFound } from "next/navigation";
import { getTemplate } from "@/templates/registry";

export default async function AdminTemplateDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const template = getTemplate((await params).id);
  if (!template) notFound();
  return (
    <>
      <Link className="text-link back-link" href="/admin/templates">
        ← All templates
      </Link>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Template details</p>
          <h1>
            {template.name}
            <span className="brand-dot">.</span>
          </h1>
          <p>{template.description}</p>
        </div>
        <span
          className={`tag ${template.status === "preview" ? "green" : "warm"}`}
        >
          {template.status === "preview"
            ? "Preview available"
            : "Design discussion pending"}
        </span>
      </div>
      <div className="detail-grid">
        <section className="panel padded-panel">
          <h2>Template definition</h2>
          <dl className="definition-list">
            <div>
              <dt>Template ID</dt>
              <dd>
                <code>{template.id}</code>
              </dd>
            </div>
            <div>
              <dt>Category</dt>
              <dd>{template.category}</dd>
            </div>
            <div>
              <dt>Content schema</dt>
              <dd>Version {template.schemaVersion}</dd>
            </div>
            <div>
              <dt>Data source</dt>
              <dd>Fictional demo content in code</dd>
            </div>
          </dl>
          <h3>Palette</h3>
          <div className="palette-details">
            {template.palette.map((color) => (
              <div key={color}>
                <span style={{ backgroundColor: color }} />
                <code>{color}</code>
              </div>
            ))}
          </div>
        </section>
        <section className="panel padded-panel">
          <h2>Invitation sections</h2>
          <ol className="section-list">
            {template.sections.map((section) => (
              <li key={section}>{section}</li>
            ))}
          </ol>
          {template.status === "preview" ? (
            <div className="button-row">
              <Link
                className="button primary"
                href={`/templates/${template.id}`}
              >
                Open demo ↗
              </Link>
              <Link
                className="button outline"
                href={`/admin/templates/${template.id}/sandbox`}
              >
                Try demo content
              </Link>
            </div>
          ) : (
            <div>
              <p className="notice">
                This invitation is being built section by section. The opening
                is ready for local review; the public preview remains
                unavailable.
              </p>
              {template.id === "royal-wedding" && (
                <div className="button-row" style={{ marginTop: 18 }}>
                  <Link
                    className="button primary"
                    href="/admin/templates/royal-wedding/preview"
                  >
                    Review opening animation ↗
                  </Link>
                  <Link
                    className="button outline"
                    href="/preview/royal-wedding"
                  >
                    Full design review ↗
                  </Link>
                  <Link
                    className="button outline"
                    href="/admin/templates/royal-wedding/sandbox"
                  >
                    Try demo content
                  </Link>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
