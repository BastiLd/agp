# Aufgabenliste – kleiner Node-Server ohne Fremdpakete
FROM node:22-alpine

ENV NODE_ENV=production \
    TZ=Europe/Vienna \
    PORT=8080 \
    DATEN=/app/daten

WORKDIR /app

# Zeitzonendaten, damit 14:00 wirklich 14:00 Ortszeit heißt
RUN apk add --no-cache tzdata wget

COPY package.json ./
COPY server ./server
COPY public ./public

# Ohne Root laufen lassen
RUN mkdir -p /app/daten \
 && addgroup -S aufgaben \
 && adduser -S aufgaben -G aufgaben \
 && chown -R aufgaben:aufgaben /app
USER aufgaben

EXPOSE 8080

HEALTHCHECK --interval=60s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/info" > /dev/null || exit 1

CMD ["node", "server/server.js"]
