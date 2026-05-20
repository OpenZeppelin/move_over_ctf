FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine

LABEL org.opencontainers.image.source=https://github.com/OpenZeppelin/move_over_ctf

WORKDIR /app

COPY --from=builder /app/out ./out

RUN npm install -g serve

EXPOSE 3000
# NOTE: do NOT add `-s` (single-page-app) — that flag rewrites every request
# to /index.html, which strips per-page <meta> tags (og:image, canonical, …)
# and breaks Slack/X social previews. With `output: "export"` +
# `trailingSlash: true` every route already ships its own index.html, and
# `serve` falls back to the Next-built 404.html for missing routes on its own.
CMD ["serve", "out", "-l", "3000"]
