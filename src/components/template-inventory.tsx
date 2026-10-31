"use client";
import { useState } from "react";
import Link from "next/link";
import type { TemplateDefinition } from "@/templates/types";
import { Icon } from "./icon";

export function TemplateInventory({
  templates,
}: {
  templates: readonly TemplateDefinition[];
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const filtered = templates.filter(
    (template) =>
      `${template.name} ${template.id}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (status === "all" || template.status === status),
  );
  return (
    <>
      <div className="inventory-toolbar">
        <label className="search-field">
          <span className="sr-only">Search templates</span>
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <circle cx="10" cy="10" r="6" />
            <path d="m15 15 6 6" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search templates…"
          />
        </label>
        <label className="filter-field">
          <span className="sr-only">Filter template status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="preview">Preview available</option>
            <option value="planned">Planned</option>
          </select>
        </label>
      </div>
      <div className="panel table-container">
        <table>
          <caption className="sr-only">Registered invitation templates</caption>
          <thead>
            <tr>
              <th>Template</th>
              <th>Status</th>
              <th>Palette</th>
              <th>Schema</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((template) => (
              <tr key={template.id}>
                <td>
                  <Link
                    className="table-name"
                    href={`/admin/templates/${template.id}`}
                  >
                    {template.name}
                  </Link>
                  <span className="table-subtitle">
                    {template.id} · {template.category}
                  </span>
                </td>
                <td>
                  <span
                    className={`tag ${template.status === "preview" ? "green" : "warm"}`}
                  >
                    {template.status === "preview"
                      ? "Preview available"
                      : "Planned"}
                  </span>
                </td>
                <td>
                  <div
                    className="palette"
                    aria-label={template.palette.join(", ")}
                  >
                    {template.palette.map((color) => (
                      <span
                        key={color}
                        title={color}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </td>
                <td>
                  <code>v{template.schemaVersion}</code>
                </td>
                <td>
                  <div className="table-actions">
                    <Link
                      className="text-link"
                      href={`/admin/templates/${template.id}`}
                    >
                      Details
                    </Link>
                    {template.status === "preview" && (
                      <Link
                        className="icon-link"
                        href={`/templates/${template.id}`}
                        aria-label={`Preview ${template.name}`}
                      >
                        <Icon name="external" size={16} />
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && (
          <div className="empty-state">
            <h2>No matching templates</h2>
            <p>Try another name or status filter.</p>
            <button
              className="button outline"
              onClick={() => {
                setQuery("");
                setStatus("all");
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
      <p className="small inventory-count">
        {filtered.length} of {templates.length} registered templates · Catalog
        changes are made in code in this milestone.
      </p>
    </>
  );
}
