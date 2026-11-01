# Production Docker and operations

## Full application stack

`compose.production.yml` runs **Next.js and PostgreSQL in Docker** and connects to your existing Traefik. It does not install another proxy or mount the Docker socket. No app/database host ports are published.

- `app`: standalone Next.js on internal port **3000**, non-root UID/GID **1000:1000**, read-only filesystem, writable media/cache volumes, readiness checks, resource limits, dropped capabilities, rotated logs, and graceful shutdown.
- `postgres`: digest-pinned PostgreSQL 17 on a private internal network, with a persistent volume and separate bootstrap, migration, and restricted application roles.
- `migrate`: one-off Prisma migration container, protected by a database advisory lock. App startup requires successful migrations.
- `tools`: operational image for catalog registration and interactive admin creation. Never exposed through Traefik.
- `media-backup`: explicitly invoked read-only media archive helper, without credentials or network access.

Rate limits currently use PostgreSQL; this stack does not add an unused Redis service. Local development remains Next.js on the host plus `compose.db.yml`.

## 1. Prerequisites

Use a Linux VPS with Docker Engine and the current Docker Compose v2 plugin. Allow capacity for image builds and backups as well as the app/database; a 4 GB server or building images elsewhere is a reasonable starting point. Restrict SSH and expose only your existing proxy's HTTP/HTTPS ports publicly.

Point the invitation domain's DNS to the server. Confirm your existing Traefik has:

- Docker provider enabled, preferably `exposedByDefault=false`.
- External Docker network `traefik-network`.
- `websecure` entrypoint and working `letsencrypt` certificate resolver.
- HTTP-to-HTTPS redirection in its existing configuration.

```sh
docker network inspect traefik-network
docker compose version
```

Keep the shared proxy network limited to trusted containers. Other containers on it can reach this app directly within Docker. This project does not change your Traefik setup or certificate storage.

Transfer the source checkout to the server without local `.env` files, `node_modules`, private media, or development database data. Node.js is not required on the server host. Use separate project names, domains, secrets and volumes for staging. Concurrent stacks on the same Traefik also need distinct router/service label names; the defaults here are `invitation`.

## 2. Configuration and secrets

From the project root on Linux:

```sh
cp .env.production.example .env.production
chmod 600 .env.production
```

Edit these non-secret settings:

```dotenv
COMPOSE_PROJECT_NAME=invitation-production
DOMAIN=invite.yourdomain.com
APP_IMAGE=events-invitation:release-001
OPS_IMAGE=events-invitation-ops:release-001
DB_NAME=invitations
DB_APP_USER=invitation_app
DB_MIGRATION_USER=invitation_migrator
TZ=Asia/Kolkata
TRAEFIK_NETWORK=traefik-network
TRAEFIK_CERT_RESOLVER=letsencrypt
SECRETS_DIR=./secrets/production
TRUST_PROXY=false
```

Set a real domain without a scheme/path. Compose derives `APP_URL=https://${DOMAIN}`. For full releases, APP/OPS images must represent the same source release; prefer commit tags or registry digests, never reusable `latest`. A confirmed design-only update may reuse the unchanged operational image as described in section 6. Database role names use lowercase letters/digits/underscores, starting with a letter. The database name also allows hyphens, such as `event-invitation`.

Generate five independent secrets without printing their values:

```sh
docker run --rm --user "$(id -u):$(id -g)" \
  -v "$PWD:/workspace" -w /workspace \
  node:22-bookworm-slim@sha256:4b150b48b4116e2a22f2c39cc27025fbf4f153e2078fd3b14d159fdb5c7279da \
  node scripts/init-production-secrets.mjs
sudo chown -R 1000:1000 secrets/production
sudo chmod 700 secrets/production
sudo chmod 400 secrets/production/*
```

The generator refuses to overwrite existing files. File ownership **1000:1000** is required: Compose file-backed secrets retain host ownership rather than remapping `uid`/`gid`. PostgreSQL reads its mounts through the root entrypoint before dropping privileges. The web container receives only its runtime database password and session/MFA keys, never the migration/bootstrap passwords. Operational jobs receive database passwords, not session/MFA keys.

Compose secrets are protected host files, not an encrypted vault. Keep an encrypted recovery copy outside the VPS, restrict Docker/host access, and never commit secrets. `.dockerignore` excludes all env files, secrets, private media and test artifacts from builds. Do not use real credentials as build arguments or `NEXT_PUBLIC_*` values. If you change `SECRETS_DIR`, pass the same path as the generator's last argument and adjust the ownership commands.

`TRUST_PROXY=true` is appropriate only if Traefik sanitizes forwarded headers and untrusted clients cannot bypass it. Review your actual proxy configuration first. The default false uses a conservative shared IP rate-limit bucket; account-specific limits still apply.

## 3. Build the Next.js and operational images

```sh
docker compose --env-file .env.production -f compose.production.yml config --quiet
docker compose --env-file .env.production -f compose.production.yml build --pull app migrate
```

The multi-stage Dockerfile installs locked dependencies, generates Prisma and runs `next build` without real secrets or a live database. The smaller web image uses standalone output; the operational image includes Prisma CLI/tsx. Google Fonts must be reachable for uncached builds. Debian/glibc supports native Argon2 and Sharp.

Alternatively build once in CI, push both immutable images, set their registry references in `.env.production`, then pull on the server:

```sh
docker compose --env-file .env.production -f compose.production.yml pull app migrate
```

Build for the server architecture. Scan **both** images with your installed container scanner before release. Base image digests are pinned; review upgrades deliberately. The operational image contains development tooling, so its advisories must also be assessed.

## 4. First deployment and admin bootstrap

Run in order, stopping if any command fails:

```sh
docker compose --env-file .env.production -f compose.production.yml up -d --wait postgres
docker compose --env-file .env.production -f compose.production.yml run --rm migrate
docker compose --env-file .env.production -f compose.production.yml run --rm tools --import tsx scripts/catalog-sync.ts
docker compose --env-file .env.production -f compose.production.yml run --rm tools --import tsx scripts/admin-bootstrap.ts
docker compose --env-file .env.production -f compose.production.yml up -d --wait app
docker compose --env-file .env.production -f compose.production.yml ps
curl --fail --show-error 'https://invite.yourdomain.com/api/health?ready=1'
```

Run admin bootstrap from an interactive terminal; do not add `-T`. Enter your name, mobile with country code and hidden password (12–128 characters). It refuses a second initial admin. Catalog registration preserves existing edits and never creates customers/orders/default passwords.

Open `https://invite.yourdomain.com/login`, sign in, enroll your authenticator, save recovery codes, then use `/admin`. Customers use the same `/login` and arrive at `/dashboard`. No SMS provider is needed. See README for all admin/customer workflows.

Traefik routes to **3000**, not the other project's example port 5000. The app joins both `invitation-network` and your external `traefik-network`; PostgreSQL joins only the private internal network. Named database/media/cache volumes persist when containers are recreated.

Before customer use, verify DNS/HTTPS, login/MFA, public template rendering, uploaded images, cash activation, guest RSVP database writes, customer isolation, and CSV export through the real domain. Docker health alone does not verify those. Single-server deployments may briefly interrupt service; high availability is outside this stack.

## 5. Everyday operations

```sh
docker compose --env-file .env.production -f compose.production.yml ps
docker compose --env-file .env.production -f compose.production.yml logs --tail=100 app postgres migrate
docker compose --env-file .env.production -f compose.production.yml restart app
docker compose --env-file .env.production -f compose.production.yml stop
```

Never use `down -v` on production. Do not accidentally change the project name: that creates different empty volumes. A restart does not apply migrations. `/api/health` is liveness; `/api/health?ready=1` checks database readiness. Docker restarts exited containers but does not automatically restart an unhealthy running process; monitor externally and alert an operator. Configured logs rotate at 3 × 10 MB per service.

## 6. Release and rollback

Run the commands below **inside the existing cloned project folder on the Linux VPS**. Run each step only when the previous one succeeds. Do not rerun first-deployment secret generation or admin bootstrap, copy over `.env.production`, or change the Compose project name during an update. PostgreSQL and Traefik should already be running.

`restart app` restarts the existing container. `up -d --wait app` starts/recreates containers and waits for health checks. **Neither command rebuilds newly pulled application source.** Your workflow needs an explicit `build`, or a `pull` when images were built and published elsewhere.

Before a release, complete type checks, relevant tests, production build, dependency/container scans and isolated staging checks. Take the encrypted database/media backup described in [section 7](#7-backup-and-recovery), verify it completed, and retain the current images for rollback. Run only one deployment at a time; use a CI concurrency guard or host `flock` if automating this process. The migration advisory lock protects migrations, not the whole deployment.

### 6.1 Pull the source and retain the previous configuration

```bash
git branch --show-current
git status --short
```

Confirm this checkout is on `main` and review any local changes before continuing. Keep the server's existing production configuration and secret files.

```bash
git pull --ff-only origin main
git rev-parse --short=12 HEAD
docker compose --env-file .env.production -f compose.production.yml ps
cp -p .env.production .env.production.previous
```

`--ff-only` refuses to create an accidental merge commit on the server. If Git reports divergent history or conflicting local changes, stop and resolve them deliberately; do not force-reset the checkout. If you already successfully pulled this release, you do not need to pull it again.

The `.previous` file records the old APP/OPS references; retain those images too. Keep this file protected and out of Git. Do not overwrite it with the new release configuration before deciding whether a rollback is needed.

### 6.2 Prepare images — choose one workflow

**A. Build on the VPS from the code you pulled (your current workflow).**

Edit only the image references in your existing configuration:

```bash
nano .env.production
```

Use the commit printed above as both image tags. For example, if it printed `a1b2c3d4e5f6`, set:

```dotenv
APP_IMAGE=events-invitation:a1b2c3d4e5f6
OPS_IMAGE=events-invitation-ops:a1b2c3d4e5f6
```

Use your actual commit, not the example. Leave domain, database identifiers, project/network names and secret paths unchanged. Then build both images:

```bash
docker compose --env-file .env.production -f compose.production.yml config --quiet
docker compose --env-file .env.production -f compose.production.yml build --pull app migrate
```

Building `migrate` produces the operational image also used by `tools`. No host Node.js installation is needed. Stop if either build fails; the running app can continue using its previous image.

**B. Pull images built and published by CI (alternative workflow).**

Set `APP_IMAGE` and `OPS_IMAGE` in `.env.production` to the matching immutable release references provided by CI, for example `ghcr.io/YOUR_ORG/events-invitation:COMMIT` and `ghcr.io/YOUR_ORG/events-invitation-ops:COMMIT`. Authenticate to your registry first if it is private. Use the real organization, image names and release tag/digest, then run:

```bash
docker compose --env-file .env.production -f compose.production.yml config --quiet
docker compose --env-file .env.production -f compose.production.yml pull app migrate
```

Use **A or B**, not both. A local `build` does not publish images to a registry. After either workflow succeeds, continue below.

### 6.3 Apply migrations and deploy the prepared release

Confirm PostgreSQL is healthy in `docker compose ... ps` before using these `--no-deps` jobs. They use the existing database service without recreating it.

```bash
docker compose --env-file .env.production -f compose.production.yml run --rm --no-deps migrate
```

This runs `prisma migrate deploy` under the database advisory lock; it is a no-op when there are no pending migrations. If it fails, stop deployment and inspect the migration failure. Never reset or reseed production.

If the release adds a catalog entry, run its idempotent registration:

```bash
docker compose --env-file .env.production -f compose.production.yml run --rm --no-deps tools --import tsx scripts/catalog-sync.ts
```

The current registration preserves existing admin edits and demo content. It does not replace saved invitation wording with new sample defaults. Routine styling updates do not need catalog registration.

After migrations and any required registration succeed, deploy only the app using the image already built or pulled:

```bash
docker compose --env-file .env.production -f compose.production.yml up -d --no-deps --no-build --force-recreate --wait app
docker compose --env-file .env.production -f compose.production.yml ps
docker compose --env-file .env.production -f compose.production.yml logs --tail=100 app
```

`--no-deps` is appropriate here because the database is already healthy and you explicitly completed migrations. `--no-build` ensures this step uses the prepared release image. A single VPS can have brief downtime during app recreation.

### 6.4 Shortcut for confirmed design-only updates

Use this only when the update changes invitation presentation/artwork and has **no migrations, operational-script changes, new catalog registration or deployment-configuration changes**. If unsure, use the full procedure above. Keep the existing operational image in this shortcut.

After the backup/configuration preparation in 6.1, edit `.env.production` and give **APP_IMAGE only** a new commit tag as shown in 6.2 A. Then:

```bash
docker compose --env-file .env.production -f compose.production.yml config --quiet
docker compose --env-file .env.production -f compose.production.yml build app
docker compose --env-file .env.production -f compose.production.yml up -d --no-deps --no-build --force-recreate --wait app
docker compose --env-file .env.production -f compose.production.yml ps
docker compose --env-file .env.production -f compose.production.yml logs --tail=100 app
```

This is the build-on-server path for the recent invitation design changes. If using CI images instead, replace `build app` with `pull app` and use its published immutable `APP_IMAGE` reference. Neither path changes database/media volumes or customer content. Continue with the checks below.

### 6.5 Check the deployed site

Replace `invite.yourdomain.com` with your configured production domain:

```bash
curl --fail --show-error 'https://invite.yourdomain.com/api/health?ready=1'
curl --fail --show-error --output /dev/null 'https://invite.yourdomain.com/templates/royal-wedding?canvas=1'
```

Open the full-page preview in a browser and refresh it. Check the changed interactions on a phone and desktop. For a full release, also check login/MFA, a purchased invitation, media access and the relevant customer/RSVP workflow. A healthy container alone does not verify the real-domain invitation experience. If startup fails, read the app logs and verify Traefik routing rather than running the next release step blindly.

### 6.6 Roll back the application image

If verification fails and the previous application supports the current database schema, restore **only APP_IMAGE and OPS_IMAGE** in `.env.production` to the references recorded in `.env.production.previous`:

```bash
nano .env.production
docker compose --env-file .env.production -f compose.production.yml config --quiet
docker compose --env-file .env.production -f compose.production.yml up -d --no-deps --no-build --force-recreate --wait app
docker compose --env-file .env.production -f compose.production.yml ps
docker compose --env-file .env.production -f compose.production.yml logs --tail=100 app
```

The previous app image must still exist locally; for registry releases, pull the previous app image before the `up` command if needed. Repeat the HTTPS/browser checks. Do not rebuild old image tags from the new checkout or prune rollback images during a release.

This rolls back the application, not database migrations or data. Normal migrations must be backward compatible. Destructive schema changes require a separate migration and recovery plan; do not automatically restore an old database over newer customer responses.

## 7. Backup and recovery

Automatic scheduling, encrypted S3 upload/retention and alerting are not provisioned by this Compose file. Configure them before relying on production data: daily encrypted off-server database/media backups, 7 daily and 4 weekly retention, a maximum 24-hour recovery point, and decryption keys recoverable outside the VPS.

Example manual backup on Linux with Bash and `age` installed on the host. Set `BACKUP_RECIPIENT` to your public age recipient; keep the private identity elsewhere. Stop the app briefly for a matching database/media set:

```bash
set -euo pipefail
umask 077
mkdir -p backups
backup_stamp=$(date -u +%Y%m%dT%H%M%SZ)
export BACKUP_RECIPIENT='age1REPLACE_WITH_YOUR_PUBLIC_RECIPIENT'
docker compose --env-file .env.production -f compose.production.yml stop app
docker compose --env-file .env.production -f compose.production.yml exec -T postgres \
  sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc --no-owner --no-acl' \
  | age -r "$BACKUP_RECIPIENT" > "backups/$backup_stamp.database.dump.age"
docker compose --env-file .env.production -f compose.production.yml run --rm -T media-backup \
  | age -r "$BACKUP_RECIPIENT" > "backups/$backup_stamp.media.tar.gz.age"
docker compose --env-file .env.production -f compose.production.yml start app
```

If a command fails, inspect the error and restart the app deliberately. Keep only complete successful sets. Copy encrypted backups off-server and verify upload/checksum completion. Back up protected keys/config separately too; the database alone cannot recover encrypted MFA secrets.

Test restoration in an isolated Compose project with new volumes/secrets and no production router. Keep the app stopped. Initialize PostgreSQL roles first, then restore the dump into an empty database as its migration role. `RESTORE_ENV` must refer to the isolated configuration, with the same database identifiers:

```bash
export RESTORE_ENV=.env.restore
age -d -i /secure/offline-backup-identity backups/TIMESTAMP.database.dump.age \
  | docker compose --env-file "$RESTORE_ENV" -f compose.production.yml exec -T postgres \
      sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --role="$DB_MIGRATION_USER" --no-owner --no-acl --exit-on-error'
```

Inspect and substitute the **isolated** media volume name before restoring media:

```bash
age -d -i /secure/offline-backup-identity backups/TIMESTAMP.media.tar.gz.age \
  | docker compose --env-file "$RESTORE_ENV" -f compose.production.yml run --rm -T \
      --user 0:0 --entrypoint tar -v RESTORE_PROJECT_media:/restore-media media-backup \
      -C /restore-media -xzf - --no-same-owner
docker compose --env-file "$RESTORE_ENV" -f compose.production.yml run --rm -T \
  --user 0:0 --entrypoint chown -v RESTORE_PROJECT_media:/restore-media media-backup \
  -R 1000:1000 /restore-media
```

Never restore over production for a drill. Restore backed-up MFA/session keys into protected isolated mounts before testing existing admin accounts. Revoke restored sessions before reopening a recovered production service. Apply only compatible migrations, then verify counts, sample media, login/MFA, invitations and an RSVP write; record recovery time and backup age.

## 8. Credential rotation and incidents

- PostgreSQL passwords: changing a secret file does not rotate an existing role. Stop dependent workloads; use a trusted local PostgreSQL operator session with interactive `\password invitation_app` (or the relevant role), replace the matching secret with the same new value, retain UID/mode, and recreate affected services. Do not expose passwords through command arguments/history.
- Session key: rotation invalidates session hashes **and recovery-code hashes**. Plan session revocation and verified re-enrollment/recovery-code replacement.
- MFA key: decrypt with the old key and transactionally re-encrypt records before replacing it. Merely changing the file makes existing MFA secrets unreadable. Automated MFA key rotation is not supplied.
- Customer recovery: admin verifies identity offline, issues a temporary password, and revokes existing sessions.
- Admin recovery: an unused recovery code replaces the second factor after password login. Lost password/all factors requires controlled operator intervention; there is no unauthenticated reset endpoint.
- Monitor service failures, disk space, backup age, TLS expiry, and readiness externally. After incident recovery, verify login/MFA and an actual guest RSVP write before reopening service.

## Local verification of this Docker setup

The Linux web and operational images were built locally without deployment credentials or a live build-time database. An isolated Compose stack passed migrations, catalog registration, interactive admin bootstrap with a disposable account, readiness, public catalog/invitation rendering, authentication redirects, missing-secret startup rejection, non-root/read-only checks, runtime secret scoping, database/media persistence after app recreation, and a database dump/restore into a separate test database. The media archive helper also passed. Type checks passed; `npm audit --omit=dev` reported zero known vulnerabilities.

The full dependency installation still reports 16 moderate development-tool advisories. Docker Scout could not scan images because this machine is not signed into Docker. Container vulnerability scans, real-domain Traefik/TLS smoke checks, age encryption/off-server upload, scheduled backups, and external monitoring remain deployment checks; they are not claimed verified by the local smoke test.

### Official references

- [Next.js self-hosting](https://nextjs.org/docs/app/guides/self-hosting)
- [Next.js standalone output](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)
- [Docker Compose secrets](https://docs.docker.com/reference/compose-file/secrets/)
- [Docker startup ordering](https://docs.docker.com/compose/how-tos/startup-order/)
- [Traefik Docker routing](https://docs.docker.com/guides/traefik/)
