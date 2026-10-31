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

Set a real domain without a scheme/path. Compose derives `APP_URL=https://${DOMAIN}`. APP/OPS images must represent the same source release; prefer commit tags or registry digests, never reusable `latest`. Database role names use lowercase letters/digits/underscores, starting with a letter. The database name also allows hyphens, such as `event-invitation`.

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

1. Run type checks, relevant tests, production build, runtime dependency audit and container scans; validate in an isolated staging stack.
2. Take a complete encrypted database/media backup. Record and retain current APP/OPS image references.
3. Set matching new immutable image references, then pull/build them.
4. Run the migration command from step 4. It holds a database advisory lock while Prisma runs. Stop on failure; never reset production.
5. Run idempotent catalog registration if needed.
6. Run `docker compose --env-file .env.production -f compose.production.yml up -d --wait app`, then HTTPS/business smoke checks.
7. If checks fail and the schema remains backward compatible, restore the previous APP/OPS references and run:

```sh
docker compose --env-file .env.production -f compose.production.yml up -d --no-deps --wait app
```

This rolls back the app image, not schema changes. Normal migrations must be backward compatible; destructive changes need a separate recovery plan. Serialize whole deployments with your CI concurrency guard or host `flock`; the database advisory lock serializes migrations only.

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

## Documentation references

## Local verification of this Docker setup

The Linux web and operational images were built locally without deployment credentials or a live build-time database. An isolated Compose stack passed migrations, catalog registration, readiness, public catalog/invitation rendering, authentication redirects, missing-secret startup rejection, non-root/read-only checks, runtime secret scoping, database/media persistence after app recreation, and a database dump/restore into a separate test database. The media archive helper also passed. Type checks passed; `npm audit --omit=dev` reported zero known vulnerabilities.

The full dependency installation still reports 16 moderate development-tool advisories. Docker Scout could not scan images because this machine is not signed into Docker. Container vulnerability scans, real-domain Traefik/TLS smoke checks, age encryption/off-server upload, scheduled backups, and external monitoring remain deployment checks; they are not claimed verified by the local smoke test.

### Official references

- [Next.js self-hosting](https://nextjs.org/docs/app/guides/self-hosting)
- [Next.js standalone output](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)
- [Docker Compose secrets](https://docs.docker.com/reference/compose-file/secrets/)
- [Docker startup ordering](https://docs.docker.com/compose/how-tos/startup-order/)
- [Traefik Docker routing](https://docs.docker.com/guides/traefik/)
