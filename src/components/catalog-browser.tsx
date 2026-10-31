"use client";

import { useState } from "react";
import type { TemplateDefinition } from "@/templates/types";
import { TemplateCard } from "./template-card";
import { Icon } from "./icon";

export function CatalogBrowser({
  templates,
}: {
  templates: readonly TemplateDefinition[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("featured");
  const filtered = templates
    .filter(
      (template) =>
        `${template.name} ${template.description}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()) &&
        (filter === "all" || template.status === filter),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : Number(a.status === "planned") - Number(b.status === "planned"),
    );

  return (
    <>
      <div className="collection-controls">
        <div className="filter-tabs" aria-label="Filter invitations">
          {[
            ["all", "All invitations"],
            ["preview", "Available to preview"],
            ["planned", "Coming soon"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              className={filter === value ? "selected" : ""}
              onClick={() => setFilter(value)}
            >
              {label}
              <span>
                {
                  templates.filter(
                    (template) => value === "all" || template.status === value,
                  ).length
                }
              </span>
            </button>
          ))}
        </div>
        <label className="search-field">
          <Icon name="search" size={17} />
          <span className="sr-only">Search invitations</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find an invitation…"
          />
        </label>
      </div>
      <div className="collection-result-bar">
        <p role="status">
          {filtered.length}{" "}
          {filtered.length === 1 ? "invitation" : "invitations"}
          {query && ` matching “${query}”`}
        </p>
        <label>
          Sort by{" "}
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="featured">Featured</option>
            <option value="name">Name: A–Z</option>
          </select>
        </label>
      </div>
      {filtered.length ? (
        <div className="template-grid">
          {filtered.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      ) : (
        <div className="empty-state collection-empty">
          <span className="empty-icon">
            <Icon name="search" size={28} />
          </span>
          <h2>No invitations found</h2>
          <p>Try a different search or explore the full collection.</p>
          <button
            type="button"
            className="button outline"
            onClick={() => {
              setQuery("");
              setFilter("all");
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </>
  );
}
