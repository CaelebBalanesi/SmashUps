# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /build

# sqlite3 requires native compilation tools
RUN apk add --no-cache python3 make g++

COPY package.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Stage 2: Production ───────────────────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app

# Build tools needed to compile sqlite3 native bindings; removed after install
RUN apk add --no-cache python3 make g++

COPY package.json ./
RUN npm install --omit=dev \
  && apk del python3 make g++ \
  && npm cache clean --force

COPY --from=builder /build/dist ./dist

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/server.js"]
