# Invitation Business App

## Current milestone

1. Fresh Next.js project in this directory, generated through create-next-app.
2. Basic public catalog and working template preview links.
3. A dedicated template directory and typed code-based registry for adding invitation designs.
4. Basic admin side for template/invitation management. Make unfinished capabilities explicit.
5. Discuss the invitation/template with the user before designing it.

### Preview clarification

- A demo preview is the invitation/template itself at a public web link with dummy bride and groom names and fictional invitation details.
- Do not add a demo RSVP form, simulated RSVP submissions, or a separate demo application.
- The same registered renderer will receive customer data when real publishing is implemented.
- The current technical foundation sample is not the finalized Royal Wedding design.
- Do not add temporary JSON/file or SQLite persistence. The admin foundation is a development-only inventory and visual content sandbox using React state; saving and publishing come after persistence is discussed.

### Application UI direction

- The public website and admin application have their own neutral product identity. Do not style the entire app like Royal Wedding or any other individual invitation.
- Support a collection of visually different templates, each rendering within its own preview canvas.
- Provide polished responsive layouts, readable hierarchy, accessible controls, clear statuses and empty states, and meaningful search/filter interactions.
- Public preview tools include desktop/mobile viewport switching and copying the shareable preview link. The invitation itself receives dummy bride and groom names from its template definition.

Run Next.js locally. PostgreSQL can run in Docker for local development when persistence is introduced. Production Docker and deployment come at the end. Do not prematurely implement the entire original SaaS specification.

## Agreed business workflow for later milestones

- Visitors browse template demos with dummy data and no signup.
- Admin collects cash offline, personalizes invitations, assigns customers, and manually activates them.
- Customer login uses mobile number and password, with admin-created accounts and a first-login password change. Admin verifies recovery requests offline.
- Customers can edit their own activated invitation's main wedding date, invitation message, and invitee closing fields, alongside RSVP management. Admin retains control over bride/groom names, template, layout, activation, validity, payments, and coupons.
- RSVP tools, counts, lists, entry, and exports appear only for invitations whose order enables RSVP. Enforce this on the server; disabling preserves records and re-enabling restores access.
- Each customer may own multiple invitations with independent content, revisions, layouts, expiry dates, feature settings, and guest records.
- Admin can toggle and reorder supported sections per purchase. An enabled opening remains the entry experience; body sections can be reordered.
- Content edits by either role are previewed privately before explicit publication to the existing permanent link. Detect stale revisions rather than silently overwriting newer changes.
- Initial customer text limits: invitation message 1,000 characters; invitee introduction 200; elder name 100; each of up to six host names 100; family sign-off 200. Main wedding date changes do not change individual ceremony dates.
- One customer can own multiple invitations.
- Subscription means per-invitation validity, with manual renewal. Expiry closes the public invitation and new responses while preserving customer access to existing RSVP records.
- Admin applies percentage, fixed-amount, or free coupons. Preserve price, discount, cash amount, and transaction history. Use atomic, idempotent activation/redemption.
- Purchased links use unique readable /invite/[slug] URLs, such as /invite/aarav-weds-meera. Check availability and lock the slug after publishing, including through expiry and renewal.
- No self-service editor, checkout, payment gateway, automated billing, drag-and-drop builder, or digital shagun.

## Royal Wedding: build and review section by section

- Theme: royal wedding, palace-inspired ornamental details.
- Colors: deep burgundy #501B2B, champagne gold #D6BC83, warm parchment #F7F0E2.
- Order: sealed-envelope opening -> dedicated Ganeshji animation -> main invitation/couple and parents -> wedding date reveal with confetti -> events -> RSVP when enabled on a purchased invitation -> invitee closing.
- Invitation wording remains English, with the explicit Gujarati blessing exception “॥ શ્રી ગણેશાય નમઃ ॥” beneath Ganeshji, as in the reference.
- The opening was reviewed first. The remaining complete invitation design is now implemented for local review, following the user's approved full-design plan.
- The opening uses generated burgundy embossed flap/pocket layers with champagne-gold edging and a blank gold wax seal. The seal is the keyboard-accessible opening control, with a “Tap the seal to open” hint. Original rose-gold PNGs remain for rollback. Envelope artwork fills containers up to 600px wide and stays centered in portrait format on larger previews.
- The original seal contains existing names/date baked into the image; these are explicitly temporary artwork, not personalized customer details.
- Invitee closing follows the original Royal Heritage structure: formal lead-in, elder, hosts, family sign-off, ornamental card, emblem. Content must be editable.
- Date reveal follows Royal Heritage's day/month/year wheels, with scroll-driven motion on taller canvases and an entrance-triggered sequence on short previews. Details and countdown appear only after settlement; reduced motion shows the final date immediately. Celebration runs once per replay.
- No story or gallery sections in the new template. Respect reduced motion, keyboard access, readable contrast, and user-initiated music.
- Original reference: D:/Coding_and_projects/digital-invitation/APP_FEATURES_AND_FUNCTIONALITIES.md and its invitation_app directory; read-only references.

### Opening implementation

The in-progress opening is available locally at `/admin/templates/royal-wedding/preview`; public Royal Wedding availability remains unchanged. Assets and palette are isolated in `src/templates/royal-wedding/opening/config.ts`. Native Web Animations completion events coordinate motion. Skip, replay, keyboard access, reduced motion, image fallback/retry, resize completion, and navigation cleanup are supported. Playwright uses installed Google Chrome; screenshots stay under ignored `work/browser-results/`.

Ganeshji reveals prominently in the center, pauses, and moves into a measured normal-flow header position. The Gujarati blessing appears word by word beneath it in a subtle gold ribbon, using bundled Noto Serif Gujarati with its OFL license. The header scrolls naturally with following content; the `RoyalOpening` component accepts a `children` slot directly below it. The completed canvas can scroll while the active opening remains constrained.

The centered Ganeshji pose is stationary during its fade-in and an 850 ms hold before moving upward. Its position is measured from the current canvas bounds, including any outer-page scrolling during the envelope sequence. The aura is soft, diffused lighting with no outlined/dashed circles. It fades away during the upward movement and is completely hidden in the final header; no aura remains behind Ganeshji at the top.

### Complete Royal Wedding review

- Current review direction: use the original Royal Heritage composition as the baseline. The main invitation is a compact glass folio with a single-line couple title, quote panel, family lineage panel, and invitation message panel. Palace artwork is continuous behind Ganeshji and the folio. The date uses a glass wheel cassette and countdown pedestals. Folio/panel entrances use the reference's 1.1-second unfold and 0.9-second staggered panels. Both standalone A & M badges remain removed. The envelope and central Ganeshji choreography are retained.
- Sections beneath the header: invitation and parents, rolling wedding date, six illustrated ceremony scenes with navigation, optional private RSVP design review, and the formal family closing.
- Main English fonts are Cormorant Garamond and Manrope through `next/font/google`: Next.js fetches and bundles them automatically, with no manually maintained font downloads. Gujarati retains its existing local font. Builds require Google Fonts network access when uncached.
- `RoyalWeddingContent` extends the shared content shape with parents, ceremonies, structured invitee fields, and an explicit India-offset wedding start timestamp for the countdown. Fictional data and artwork remain separate from rendering. Generated palace artwork and responsive crops total 1,844,720 bytes; prompts and asset notes are in the template's ARTWORK.md.
- RSVP is disabled and non-interactive, shown only when the local admin's review switch is on. Demo mode omits it entirely. No responses, storage, or live submission behavior exist.
- GSAP/ScrollTrigger coordinate scenes within the invitation's own scroll container after opening completes. Palette, asset references, and focal positions remain configurable. Reduced motion shows content immediately and omits confetti; the keyboard date shortcut settles the date. Replay resets the full experience. No wheel/touch interception or global scroll replacement is used.
- Royal Wedding remains planned and unavailable publicly. The local host preview is on port 3001; production admin access remains disabled.
- Dedicated full-page preview: `/preview/royal-wedding`, outside the admin layout, protected by the same development/loopback guard and excluded from indexing. It uses the full viewport without toolbar, sidebar, or device frame. It includes the disabled RSVP design for review, as requested; public demos still omit RSVP. Both names fit the first view at 588×615.
- Handoff stability: prepare the palace image and heading/body fonts before opening; establish GSAP starting poses in a layout effect and CSS before paint; use one timeline for backdrop and folio; keep the blurred folio stationary instead of scaling it with nested name transforms. Reserve scrollbar space throughout opening. The frame-sampling Chrome regression checks opacity continuity, horizontal position, and unchanged scroll position.
- Review refinements: date copy is minimal (“The Wedding”, “Show date”, “Continue”); date wheels occupy 0.9 screen-heights of scrolling followed by 1.5 screen-heights of pinned reading time. Short/reduced-motion layouts remain unpinned. Shared RoyalCorners ornaments are present on all five stationery surfaces. Dividers are retained with a geometric gold centre, replacing the rejected floral divider. Card nesting, thick inset borders, and countdown boxes have been reduced.
- Events use the original Royal Heritage centered portrait composition on mobile and desktop: date above the artwork, unboxed ceremony details beneath, gold image corners/dividers, and compact bottom navigation with 44px targets. Burgundy gradients crossfade with muted ceremony-specific rose/amber/plum/champagne accents. GSAP independently clears outgoing text/artwork and brings in the next image and staggered details; the outer panel never scales. Reading holds occupy 0.75 canvas heights, transitions 0.45, and the final exit 0.35, plus the visible viewport. Text stays at least 14px for practical information; measured remaining height determines artwork size. Reduced motion or less than 120px available for artwork uses natural flow. Inactive pinned panels are inert; keyboard navigation focuses the settled heading. Resizing preserves the active ceremony, and replay resets the section. Event settings live in design.ts; no content schema changes.


Current RSVP/invitee refinement preserves the existing burgundy canvas and palace closing backdrop. RSVP keeps its localized parchment form with 14px labels, 16px controls, grouped details, attendance radios, ceremony choices, and optional preferences; controls remain disabled and omitted in demo mode. The invitee folio now matches the main invitation/date frosted-glass treatment: translucent burgundy, 10px backdrop blur, parchment text, champagne-gold accents, and a dark readable fallback. Family copy, hierarchy, balanced spacing, and gold dividers remain. Entrances use small fades/translations instead of perspective flips. The rejected full-width light stationery redesign and creator-footer addition remain reverted.

## Production requirements to implement later

- PostgreSQL with migrations, Redis rate limits, ownership enforcement, Argon2id passwords, revocable server-side sessions, admin authenticator MFA/recovery codes, and secure cookies.
- CSRF/origin defenses, server validation, upload validation, no private-data exposure or private caching, search exclusion for live invites, audit records, and safe CSV export.
- Live RSVP success requires a confirmed database write; validate party limits, deadlines, selected ceremonies, and per-invitation duplicate phones.
- Linux VPS with Docker Compose: app, PostgreSQL, Redis, Caddy HTTPS, and backups. Expose only HTTP/HTTPS publicly.
- Non-secret env configuration and file-mounted secrets; no real secrets in Git/images/browser bundles. Separate restricted runtime DB role from migration credentials.
- Immutable releases, staging checks, controlled migration job/deployment lock, health checks, pre-release backups, and compatible rollback.
- Daily encrypted off-server database/media backups, 7 daily and 4 weekly retention, tested restores, logs, and alerts.

## Full application and production container update

Public preview update: `/templates/royal-wedding?canvas=1` now includes the RSVP layout, superseding the earlier demo-omission requirement. Per the latest request, preview fields are editable so visitors can try them; only submission remains disabled. A visible preview-only note explains this, and no RSVP requests or response storage are used. Purchased invitation RSVP remains governed by the order's enabled sections and live entitlement.

RSVP visual update: the approved form now uses burgundy frosted glass to match the invitation and family closing, replacing its earlier parchment surface. It retains engraved gold corners, parchment text, 16px fields, selectable attendance/ceremony tiles, clear focus states, and a separated champagne submit area. The surface and field groups have independent restrained entrances, with an opaque fallback and immediate reduced-motion presentation. Existing live submission and static-preview behavior are retained.

Scroll stability update: invitation scenes share measured viewport geometry and coalesced, scroller-specific GSAP refreshes. Small height-only changes from mobile browser controls or the keyboard preserve scene measurements and active ceremony position; width/orientation changes and embedded preview resizing still remeasure. The palace uses a responsive image layer measured from invitation content rather than a viewport-height-dependent CSS background. Native touch/wheel scrolling is preserved. The catalog's framed preview uses the stable small viewport height.

Date reveal refinement: the Show date shortcut is removed, including its force-reveal state. Hidden details retain their layout space, the countdown reserves 72px, and the existing scroll cue sits 24px below the card on mobile and 32px on wider canvases. A content-fit check uses unpinned natural flow when the full date composition cannot fit. The completed invitation scroller is keyboard-focusable with a visible outline; native scrolling replaces the shortcut. Scroll reveal, reverse motion, reading hold, single celebration and reduced-motion behavior remain.

The date card shows only the date and countdown, with the venue removed from this section (ceremony venues remain in Events). Its post-reveal reading hold is extended to two canvas heights of scrolling before release. Ordinary phone layouts retain pinning when the date composition fits; reduced motion and insufficient-height layouts stay in natural flow.

Scroll UX refinement: a compact Explore menu appears after opening, reflects enabled section order, supports keyboard dismissal/focus, and hides during field editing. Nearby section jumps use native smooth scrolling; long jumps and reduced motion are instant, with Date/Events landing in reading positions. Natural-flow/reduced-motion ceremony tracking uses IntersectionObserver, final ceremony text remains opaque, and progress updates use cached GSAP setters. Current/adjacent ceremony artwork is prepared progressively and retained for reverse navigation. RSVP groups reveal near the viewport or immediately on focus; closing text moves independently of the folio. The countdown updates in its own component only when visible and the document is active. No scrolling library or backend/schema change is introduced.

The later approved app milestone implements PostgreSQL-backed accounts, admin MFA, customer password login without SMS, manual cash activation/coupons, versioned publishing, ownership checks and live RSVP management. README documents the current admin/customer workflows. Royal Wedding's creator footer credits Vivek Vasant.

Production deployment now uses `Dockerfile` and `compose.production.yml`: Next.js standalone runtime, separate migration/tools image, PostgreSQL, private networking, mounted secret files, persistent media/database volumes, and the user's existing external Traefik network. This supersedes the earlier proposed Caddy deployment and database-only production instructions. Local development remains host Next.js plus Docker PostgreSQL. OPERATIONS.md contains deployment, updates, rollback, backup/restore and credential guidance. Off-server backup scheduling/retention and external monitoring still require operator setup; do not infer a verified public launch from container configuration alone.

## Chat/project organization

The user wants this chat associated with a ChatGPT desktop project whose primary folder is this directory. This session did not expose project/thread-management tools; file creation alone does not move the chat or establish project membership.
