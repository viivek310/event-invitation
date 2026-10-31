# syntax=docker/dockerfile:1
ARG NODE_IMAGE=node:22-bookworm-slim@sha256:4b150b48b4116e2a22f2c39cc27025fbf4f153e2078fd3b14d159fdb5c7279da
FROM ${NODE_IMAGE} AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

FROM base AS dependencies
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS builder
COPY . .
# A non-routable build-only value satisfies Prisma config discovery. No real
# database, credentials or deployment configuration is used during the build.
RUN MIGRATION_DATABASE_URL=postgresql://build:build@127.0.0.1:1/build npm run db:generate
RUN npm run build

# Explicit operational image: Prisma CLI/tsx are kept out of the web image.
FROM base AS operations
ENV NODE_ENV=production
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/package.json /app/package-lock.json /app/prisma.config.ts ./
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/scripts ./scripts
COPY --from=builder --chown=node:node /app/src/templates/royal-wedding/content.ts ./src/templates/royal-wedding/content.ts
COPY --from=builder --chown=node:node /app/docker ./docker
USER node
ENTRYPOINT ["node", "--import", "./docker/load-secrets.mjs"]
CMD ["docker/migrate.mjs"]

FROM base AS runner
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/docker ./docker
RUN mkdir -p /app/private-media /app/.next/cache && chown -R node:node /app/private-media /app/.next/cache
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD ["node", "docker/healthcheck.mjs"]
ENTRYPOINT ["node", "--import", "./docker/load-secrets.mjs"]
CMD ["server.js"]
