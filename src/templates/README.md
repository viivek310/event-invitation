# Invitation templates

A public demo is the invitation itself rendered with fictional content. It is not a separate demo app or an RSVP simulation. Current preview links have no RSVP form, submission, or saving behavior.

## Directory structure

```text
templates/
  types.ts                 Shared content and renderer contracts
  registry.ts              Serializable template definitions
  renderers.ts             Template ID -> invitation component
  foundation/
    definition.ts          Sample metadata and dummy names/content
    renderer.tsx           Simple technical sample, not a finalized design
  royal-wedding/
    definition.ts          Agreed concept; planned and not publicly available
```

## Add a design

1. Create a directory under `src/templates/<design-name>/`.
2. Add a typed `TemplateDefinition` in `definition.ts`, with a unique lowercase hyphenated `id`. Keep dummy names, dates, venue, invitation text, and family details in `demo`. Add its own thumbnail under `public/templates/<id>/` and reference that local path in `thumbnail`, so different templates keep their own imagery.
3. Add `renderer.tsx` accepting `TemplateProps`. Render content from its props, not hardcoded customer details. Components with interactions should declare `"use client"`; static renderers can stay Server Components.
4. Register the definition in `registry.ts` and the renderer in `renderers.ts`.
5. Set `status: "preview"` only when the renderer is implemented. Open `/templates/<id>`; the route supplies `definition.demo` to that renderer.
6. Check the catalog, template inventory, preview, mobile layout, and keyboard access. Run `npm run typecheck`, `npm test`, and `npm run build`.

Status `planned` can appear as a clearly labeled Coming soon tile in the public collection and in the local workspace inventory. It has no working preview link. Unknown IDs and planned preview URLs return 404.

The demo content editor changes React state in its own tab. It does not persist changes or alter public preview data. Change the definition in code to update public dummy content.

## Customer invitations later

Purchased links are reserved at `/invite/[slug]`. When database-backed publishing is implemented, that route will validate availability/ownership metadata and pass the customer's real content to the same registered renderer. It must never substitute dummy content when an invitation is missing or unavailable.

Live RSVP collection will be implemented separately with confirmed database writes. Do not show an RSVP form in public demo mode; demos are invitation previews with dummy names and details, not RSVP simulations.

Do not build the actual Royal Wedding design until the next discussion with the user. Its palette and section order are documented in `PROJECT_BRIEF.md`.
