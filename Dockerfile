# syntax=docker/dockerfile:1.7

# ---- Builder ----
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable && \
    pnpm config set network-concurrency 4 && \
    pnpm config set fetch-retries 5 && \
    pnpm config set fetch-retry-mintimeout 20000 && \
    pnpm config set fetch-retry-maxtimeout 120000
COPY package.json ./
COPY pnpm-lock.yaml* ./
RUN pnpm install --no-frozen-lockfile --ignore-scripts
COPY . .

# NEXT_PUBLIC_* vars are inlined at build time (into both server and browser
# bundles), so the backend URL is hardcoded here. Change these two lines if the
# backend URL or root domain ever move.
ENV NEXT_PUBLIC_STORE_API_URL=https://api.joyla.online
# Root domain the storefront is served under; subdomains of it become the
# tenant slug (e.g. salom.kpos.uz -> "salom").
ENV NEXT_PUBLIC_ROOT_DOMAIN=kpos.uz
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# ---- Runtime ----
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3200
ENV HOSTNAME=0.0.0.0

# Standalone output bundles a minimal server.js + node_modules.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3200
CMD ["node", "server.js"]
