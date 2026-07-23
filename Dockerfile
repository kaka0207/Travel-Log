FROM oven/bun:1 AS base

# ---- Install dependencies ----
FROM base AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install

# ---- Runtime build mode ----
# The default Compose deployment builds the app after PostgreSQL is available,
# use the "dev" target which keeps full source + node_modules
# so the app can be built inside the container at startup.
# NOTE: This stage MUST come before builder/runner so that
# `docker build --target dev` never triggers the build stage.
FROM base AS dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

EXPOSE 3000

CMD ["bun", "start"]

# ---- Build stage (optional pre-built images) ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Build args allow passing env vars at build time for SSG
ARG DATABASE_URL
ARG DATABASE_PROVIDER
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_S3_PUBLIC_URL
ARG NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
ARG BETTER_AUTH_SECRET
ARG BETTER_AUTH_URL
ARG S3_REGION
ARG S3_ENDPOINT
ARG S3_BUCKET_NAME
ARG S3_ACCESS_KEY_ID
ARG S3_SECRET_ACCESS_KEY
ARG S3_PUBLIC_URL
ENV DATABASE_URL=$DATABASE_URL
ENV DATABASE_PROVIDER=$DATABASE_PROVIDER
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_S3_PUBLIC_URL=$NEXT_PUBLIC_S3_PUBLIC_URL
ENV NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=$NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
ENV BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET
ENV BETTER_AUTH_URL=$BETTER_AUTH_URL
ENV S3_REGION=$S3_REGION
ENV S3_ENDPOINT=$S3_ENDPOINT
ENV S3_BUCKET_NAME=$S3_BUCKET_NAME
ENV S3_ACCESS_KEY_ID=$S3_ACCESS_KEY_ID
ENV S3_SECRET_ACCESS_KEY=$S3_SECRET_ACCESS_KEY
ENV S3_PUBLIC_URL=$S3_PUBLIC_URL
RUN bun run build

# ---- Production runner (optimized standalone output) ----
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Copy standalone server + static assets from build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

CMD ["bun", "server.js"]
