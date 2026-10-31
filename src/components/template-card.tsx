import Link from "next/link";
import Image from "next/image";
import type { TemplateDefinition } from "@/templates/types";
import { Icon } from "./icon";

export function TemplateCard({ template }: { template: TemplateDefinition }) {
  const available = template.status === "preview";
  const initials = template.name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]);
  return (
    <article className={`template-card ${available ? "available" : "planned"}`}>
      <div className="template-image">
        {available ? (
          <Link
            className="artwork-link"
            href={`/templates/${template.id}`}
            aria-label={`Preview ${template.name}`}
          >
            {template.thumbnail && (
              <Image
                src={template.thumbnail}
                alt={`${template.name} invitation with sample names`}
                fill
                sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw"
                className="catalog-thumbnail"
              />
            )}
          </Link>
        ) : (
          <div className="planned-artwork">
            <div className="planned-monogram">
              {initials[0]}
              <span>{initials[1]}</span>
            </div>
            <span>{template.name.toUpperCase()}</span>
            <p>A new chapter in the collection.</p>
          </div>
        )}
        <span className={`image-label ${available ? "" : "planned-label"}`}>
          {available ? "SAMPLE INVITATION" : "IN DESIGN"}
        </span>
        {available && (
          <Link
            className="card-preview-action"
            href={`/templates/${template.id}`}
          >
            Open invitation <Icon name="external" size={14} />
          </Link>
        )}
      </div>
      <div className="template-card-heading">
        <h3>{template.name}</h3>
        <span className={`tag ${available ? "green" : ""}`}>
          {available ? "Preview available" : "Coming soon"}
        </span>
      </div>
      <p>{template.description}</p>
      <div className="template-card-footer">
        <span>{template.category}</span>
        <div
          className="palette"
          aria-label={`Design palette: ${template.palette.join(", ")}`}
        >
          {template.palette.map((color) => (
            <span key={color} style={{ backgroundColor: color }} />
          ))}
        </div>
      </div>
    </article>
  );
}
