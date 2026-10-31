# Invitation app working agreement

- This is a new Next.js project bootstrapped with the official create-next-app CLI.
- Work only in D:/Coding_and_projects/events_invitation. Do not use the earlier C: scaffold or modify the original digital-invitation project.
- Current milestone: basic app setup, public template catalog, template preview links, a code-based template directory/registry, and a basic admin workspace.
- Build this foundation first. Discuss and brainstorm the actual invitation design with the user afterward.
- During local development, run Next.js on the host. Only PostgreSQL will run in Docker when database integration is added.
- Defer production Docker, hosting, deployment, and operational automation until the end.
- Do not invent a JSON/file database or SQLite substitute. Discuss persistence requirements before adding a temporary storage layer.
- Public demo route: /templates/[templateSlug]. Purchased invitation route: /invite/[slug], never /v/.
- Template demos use fictional content and must never save live RSVP responses.
- No arbitrary purchased slug may fall back to sample data.
- Retain the longer-term agreed product direction in PROJECT_BRIEF.md.
- Read node_modules/next/AGENTS.md and relevant bundled Next.js docs before implementation.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
