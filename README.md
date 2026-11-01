# Invitation Studio

A Next.js invitation business application for public template previews, offline cash sales, manually activated invitations, and customer guest management. The application shell is independent of each template's design. Royal Wedding uses the reviewed burgundy, champagne-gold, frosted-glass design.

## Implemented

- Public template catalog and dummy-data previews; Royal Wedding is registered in PostgreSQL. Its public preview includes editable RSVP fields with submission disabled and no response storage.
- Admin-created customers, mobile-number/password login, first-login password changes, revocable database sessions, manual password resets, and account suspension. **No SMS provider, OTP messages, public signup, or email service is required.**
- Admin authenticator-app MFA with encrypted secrets and one-use recovery codes. Initial admin creation is an interactive command without default credentials.
- Database-backed customer/invitation management, structured content editing, private saved-draft preview, section controls/order, revision conflict detection, and explicit publication.
- Permanent `/invite/[slug]` links, locked after publication, with request-time activation/expiry checks and no sample-data fallback.
- Cash sale recording, server-calculated coupons, full-payment/complimentary activation, renewal, suspension, and historical sale snapshots. Activation and coupon redemption are transactional and retry-safe.
- Multiple invitations per customer. Customers can preview/publish their permitted date, message, and family-closing edits.
- Live guest RSVPs, duplicate-phone protection, party/deadline checks, customer/admin search, attendance filters, headcounts, per-ceremony totals, manual corrections, deletion, polling, and CSV export. Access requires RSVP enabled for that order.
- Restricted media uploads, optimized raster images, private media storage, controlled serving, audit history, database-backed rate limits, CSRF/origin checks, nonce-based script CSP, and private-response cache restrictions.
- Public studio contact settings and liveness/readiness endpoints.
- Royal Wedding Explore navigation, native scrolling with stable mobile scene measurements, readable ceremony exits, progressive artwork preparation, individual RSVP entrances, and visibility-aware countdown updates. Reduced-motion layouts retain accurate ceremony navigation.

Implementation is subject to the validation results reported in the delivery. Source code or test definitions alone do not imply a verified production launch.

## Local development — only PostgreSQL in Docker

Prerequisites: a supported Node.js version for Next.js/Prisma, npm, Docker Desktop with Linux containers, and Google Chrome for browser tests. Start Docker Desktop first.

```powershell
cd D:\Coding_and_projects\events_invitation
npm ci
npm run setup:local
npm run db:start
npm run db:generate
npm run db:migrate
npm run db:catalog
npm run admin:bootstrap
npm run dev
```

Run `setup:local` **once**. It creates ignored `.env` and `.env.db` files with strong independent credentials and refuses to overwrite existing configuration. `.env.example` and `.env.db.example` explain the variables. Do not copy live credentials into README, screenshots, Git, or `NEXT_PUBLIC_*` settings.

- App: http://127.0.0.1:3001
- Public catalog: http://127.0.0.1:3001/templates
- Royal Wedding demo: http://127.0.0.1:3001/templates/royal-wedding
- Sign in: http://127.0.0.1:3001/login
- Admin: http://127.0.0.1:3001/admin
- Customer dashboard: http://127.0.0.1:3001/dashboard
- Readiness: http://127.0.0.1:3001/api/health?ready=1

Bootstrap prompts for the admin name, mobile number, and a hidden password. Sign in, enroll an authenticator app, confirm its code, and store the recovery codes offline. The QR code is for an authenticator app, **not SMS verification**. Normal startup never creates default users or fake paid orders.

The admin can configure public contact details under Settings. Customers' temporary passwords are displayed once after creation/reset; share them manually and privately. Recovery requires offline identity verification.

### Everyday startup and shutdown

```powershell
npm run db:start
npm run dev
```

Stop Next.js with Ctrl+C. Stop only this project's database with:

```powershell
docker compose --env-file .env.db -f compose.db.yml stop
```

The named database volume preserves records. Do not use `down -v` unless you intentionally want to destroy this project's local data. Editing a password in an env file does not rotate an existing PostgreSQL role password.

## Admin login and first-time setup

Both admins and customers use the same [sign-in page](http://127.0.0.1:3001/login). The account's role determines which workspace opens. There are **no default usernames or passwords**.

### Create the first admin — once per database

Complete the local database setup above, then run this in your own interactive PowerShell terminal:

```powershell
cd D:\Coding_and_projects\events_invitation
npm run admin:bootstrap
```

1. Enter your admin name.
2. Enter your mobile number with its country code, such as `+91` followed by your number.
3. Enter a password of 12–128 characters. The terminal hides the password; retain it in a password manager.
4. Start the app with `npm run dev` if it is not already running.
5. Open http://127.0.0.1:3001/login and enter that mobile number and password.
6. Select **Set up authenticator app**. Scan the QR code with your authenticator app, or enter the displayed setup key manually.
7. Enter the code from the authenticator to finish enrollment.
8. Save the displayed recovery codes offline before selecting **I saved my codes**. Each code works once and the list is not shown again.
9. Open http://127.0.0.1:3001/admin.

The bootstrap command refuses to create another initial admin when one already exists. Do not rerun setup, delete records, or reset the database to solve a login problem.

### Returning admin login and recovery

Sign in with your mobile number and password, then enter an authenticator code. If you lose access to your authenticator, use an unused recovery code at the authenticator verification step. Recovery codes replace the second factor; they do not replace the password.

There is no automated admin password-reset or lost-all-factors recovery screen. If you lose your password or both your authenticator and recovery codes, recovery requires a controlled operator intervention; do not expect SMS/email recovery. Changing your password is available under **Settings → Change your password**. Use **Sign out** when finished, especially on a shared device.

## Admin operating guide

The sidebar contains **Overview, Customers, Invitations, Templates, Coupons, Sales, Settings, and Activity**. The following steps describe the currently implemented controls.

### 1. Set up your public business details

Open **Settings** and save your business name, public contact mobile number, and public email. Visitors use the public contact page to reach you. These settings do not change your admin login number or the Royal Wedding template's creator credit.

### 2. Manage the public template catalog

Open **Templates** to edit a listing's title, description, thumbnail URL, public visibility, and fictional demo content. Save changes, then use **View public template** to check the result.

- Share `/templates` or `/templates/royal-wedding` with prospective customers. Browsing requires no account.
- Keep demo names and personal details fictional. The public Royal Wedding demo lets visitors try the RSVP fields, but submission is disabled; it never submits or saves responses.
- Catalog visibility controls the listing/demo; manage a purchased invitation's availability on its own order.
- Adding a completely new layout requires a code implementation and deployment. The admin editor changes content for existing layouts.

### 3. Create a customer account

1. Open **Customers**.
2. Enter the customer's name and mobile number with country code.
3. Select **Create account**.
4. Copy the generated temporary password while it is displayed. Share it privately with that customer, along with the login URL and their registered mobile number. No SMS or email is sent automatically.

Use one customer account for all invitations owned by that person. If you miss the temporary password, use **Reset password** after verifying their identity offline; existing passwords cannot be viewed.

### 4. Create and personalize an invitation

1. Open **Invitations**, then the **Create invitation** form.
2. Choose the customer and template; enter both partner names, the wedding date, and a readable slug such as `aarav-weds-meera`.
3. Select **Create draft**, then review every content field. The starting content comes from the template demo, so replace all sample family, event, date, and venue details before activation.
4. Edit the invitation wording, parents, ceremony details, and family closing. Use the image upload controls where needed.
5. Under **Order settings**, select the sections included in this purchase. Use the up/down controls to order enabled body sections; the opening and Ganeshji remain before the body.
6. Enable **RSVP** only when included in the order. Set the maximum party size, optional deadline, and dietary/accommodation collection preferences.
7. Select **Save draft**, then **Preview saved draft**. Preview shows the last saved version, so save before reviewing.

Draft previews require an authorized account. There is no anonymous personalized pre-purchase preview link. Purchased links use `/invite/[slug]`; a slug must be unique and becomes permanently locked after first publication, including after suspension, expiry, and renewal.

### 5. Create a coupon, if needed

Open **Coupons**, enter a code, and choose **Percentage**, **Fixed rupees**, or **Complimentary access**. Set its value, optional redemption limit, optional start/end dates, and active status, then save. Use **Edit** to change an existing coupon or disable it.

Only one coupon applies per sale. Discounts and redemption availability are checked on the server when activation is committed. Historical sale amounts stay unchanged when you later edit a coupon. A free-access coupon still requires explicit complimentary confirmation on the order.

### 6. Record payment and activate the purchased link

1. Open the saved invitation and find **Cash sale and manual activation**.
2. Enter the original price in rupees, any coupon code, and the exact cash received after the discount. Partial payment is not supported by this activation flow.
3. Enter the payment date and a future **Valid until** date. Add internal notes if needed.
4. For a zero-total order, check **Explicit complimentary activation**. Free orders still require an explicit confirmation.
5. Check **I confirm the cash received or complimentary activation**.
6. Select **Record cash and activate**. Activation records the sale and publishes the saved draft together.
7. Use **Open live invitation** to verify the actual purchased page, then **Copy live link** to share it with the customer.

An invalid coupon, mismatched cash amount, or missing confirmation blocks activation. Never use a sale action merely to preview a draft. There is no online checkout, payment gateway, automatic subscription billing, or SMS notification.

### 7. Update a live invitation

Edit content or section settings, select **Save draft**, check **Preview saved draft**, then select **Publish saved changes** while the invitation is active. Unsaved edits and saved content drafts do not replace the published content until publication. Publishing is disabled while there are unsaved changes.

RSVP entitlement is an order setting: disabling it immediately removes access to response management and new submissions while preserving stored records. Review both the live page and dashboard when changing that setting. If a revision-conflict error appears, reopen the invitation to load the latest revision before editing again.

### 8. Renew, suspend, restore, or archive

- **Renew:** use **Cash sale and manual activation** again, enter the renewal payment/discount and a future expiry, then select **Record renewal and activate**. This creates a new historical sale and activates the saved revision on the same permanent link.
- **Suspend public link:** temporarily close public access. Existing responses are retained.
- **Restore active link:** restore a previously published invitation whose validity has not expired. This does not extend the expiry; expired orders require renewal.
- **Archive:** take the invitation out of public availability without deleting its records.
- **Expiry:** public access and new guest RSVPs close automatically at the configured expiry. Existing responses remain available to the owner when RSVP is enabled.

### 9. Manage guest responses

Open an RSVP-enabled invitation and use its response manager to view attendance totals, headcount, and ceremony totals; search/filter responses; manually add or correct a response; delete a response; or export CSV. Responses refresh through polling. The response table displays up to 1,000 matching records; CSV export includes all matching responses.

Live guests submit from the purchased invitation, and success appears only after the database confirms the write. The same normalized phone cannot submit twice for one invitation; correct an existing response through the dashboard instead. Demo and private design-review RSVP controls do not submit live records.

### 10. Recover or suspend a customer account

In **Customers**, verify the person's identity offline before selecting **Reset password** and confirming the verification. Share the new temporary password privately. Resetting revokes their existing sessions and requires another password change on login.

Use **Suspend** to block the account and revoke its sessions; its purchased invitations also become unavailable publicly. Use **Restore** when appropriate. Individual invitation status and expiry still apply after account restoration.

### 11. Review sales and activity

Use **Sales** for recent cash sales/renewals and links back to their invitations. Use **Activity** for recent audited administrative actions. The current lists are recent history views, not a complete accounting or billing system. Sign out after finishing administration.

## Customer login and working instructions

### First login

1. Obtain the login URL, registered mobile number, and temporary password directly from the studio. There is no public signup.
2. Open http://127.0.0.1:3001/login during local development. On a deployed site, use its domain followed by `/login`.
3. Enter your registered mobile number and temporary password.
4. When asked to change your password, enter the temporary password as **Current password**, then choose a new password of 12–128 characters.
5. After changing it, open `/dashboard` to see the invitations assigned to your account. Customer login does not require SMS or admin authenticator enrollment.

### Everyday use

- Sign in with your mobile number and your own password. One account can contain multiple invitations; choose **Manage invitation** on the correct order.
- Edit the permitted wedding date, invitation message, and family-closing fields. Save the draft, preview it, then publish the saved changes while the order is active.
- A wedding-date edit retains the configured ceremony start time/offset and does not automatically update every event date. Ask the studio to change event schedules, partner names, template, sections, pricing, or validity.
- Use **Open live invitation** or **Copy live link** to share the purchased link. A private saved-draft preview is not a guest invitation link.
- If RSVP is enabled for that order, manage/search/filter responses, view totals, correct guest information, add/delete responses, and export CSV. An order without RSVP does not expose those controls.
- Existing responses remain available after expiry when RSVP is enabled, but guests cannot access an expired invitation or add new responses. Contact the studio for renewal.
- Use the dashboard's password link to change your password; this signs out other sessions. Use **Sign out** when finished.

### Forgotten password or login problems

Contact the studio directly. After offline identity verification, the admin issues a new temporary password; use it and change it at the next login. There is no SMS OTP, email reset link, or self-service recovery.

If no invitations appear, ask the studio to check the account assignment. If a link is unavailable, ask the studio to check activation, expiry, invitation status, and account suspension. Do not create another account to recover access.

## Business workflow

1. Client chooses a public dummy-data template preview and contacts the studio offline.
2. Admin creates the customer account, creates a draft, and personalizes all couple/family/event details.
3. Configure section visibility/order and optional RSVP fields, then save and privately preview the draft.
4. Record the full discounted cash amount and a future expiry date. Explicitly confirm receipt or complimentary activation.
5. Share the permanent invitation link and customer credentials.
6. The customer changes their temporary password, manages allowed content revisions, and manages RSVPs when enabled.

Saving a content draft does not publish it. Main wedding-date edits retain the configured time/offset and do not automatically change ceremony dates. Names/template/sections/pricing/activation remain admin-only. Expired invitations reject new guest responses; historical RSVP records remain available to the owner. Feature access changes are enforced immediately on the server.

## Templates and media

Add layouts under `src/templates/<id>/` and register their renderer and metadata. Catalog content must pass the template schema before it can render. Executable layouts are deployed in code; catalog text and demo content are managed in admin. The Foundation layout remains a technical development fixture, not a customer product.

Images/audio are stored under ignored `private-media/` by default, never under `public/`. Admin uploads accept still JPEG/PNG/WebP and MP3, max 10 MB. Images are decoded, resized, re-encoded, and stripped of metadata. Uploading MP3 does not automatically enable background music. Template decorative assets remain in `public/templates/`.

## Validation

```powershell
npm run typecheck
npm test
npm run test:browser
npm run test:routes
npm run build
npm audit --omit=dev
```

Browser tests use a temporary local test operator and delete it afterward. They require the local database and must not run against production. Screenshots/traces and temporary test session files stay under ignored `work/`. First-time builds may need internet access for Next.js Google Fonts bundling; browsers use the bundled fonts.

For a read-only synthetic scroll profile, point `node scripts/profile-royal-scroll.mjs <local-optimized-preview-url> work/scroll-ux/profile.json` at a running local optimized build. It records three normal and three 4× CPU-throttled Chrome sweeps without submitting forms. Compare runs on the same machine without other builds/browser tests running. Emulation does not replace physical Android Chrome and iPhone Safari testing.

## Production Docker

The full [production Compose stack](compose.production.yml) runs **Next.js and PostgreSQL in Docker**, connecting to your existing **Traefik** via `traefik-network`. It includes a non-root standalone app image, separate migration/operational image, file-mounted secrets, private database networking, persistent volumes, readiness checks, resource limits, and rotated logs. Traefik routes to internal app port **3000**; no app/database ports are published.

Follow [OPERATIONS.md](OPERATIONS.md) for Linux server configuration, secret generation, image builds, deployment, admin bootstrap inside Docker, updates, rollback, backup/restore, and credential rotation. Start with [.env.production.example](.env.production.example). Your existing Traefik provides HTTPS; no additional proxy is installed. Automated off-server backup scheduling/retention and alerting require operator setup. Do not use `next dev` in production.
