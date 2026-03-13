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
CMD ["serve", "-s", "out", "-l", "3000"]
