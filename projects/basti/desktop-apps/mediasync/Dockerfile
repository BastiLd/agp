# syntax=docker/dockerfile:1

# --- Stage 1: build the web frontend (Vite → static files) ------------------
FROM node:20-alpine AS web
WORKDIR /web
COPY web/package.json ./
RUN npm install
COPY web/ ./
RUN npm run build

# --- Stage 2: build the server bundle (esbuild → dist/server.js) ------------
FROM node:20-alpine AS server
WORKDIR /server
COPY server/package.json ./
RUN npm install
COPY server/ ./
RUN npm run build

# --- Stage 3: slim runtime image -------------------------------------------
FROM node:20-alpine AS runtime
RUN apk add --no-cache su-exec
WORKDIR /app/server

# Production dependencies only (fastify, @fastify/*, fuse.js, sql.js incl. WASM)
COPY server/package.json ./
RUN npm install --omit=dev && npm cache clean --force

# Server bundle + static web build served from dist/public
COPY --from=server /server/dist ./dist
COPY --from=web /web/dist ./dist/public

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0 \
    CONFIG_DIR=/config \
    MEDIA_ROOTS=/media

EXPOSE 3000
VOLUME ["/config"]

ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "dist/server.js"]
