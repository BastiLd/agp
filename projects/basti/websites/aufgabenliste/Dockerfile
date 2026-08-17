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

# Ohne Root laufen lassen. Bewusst der im Node-Image vorhandene Benutzer
# "node" mit der festen UID/GID 1000 – vorher wurde die Nummer automatisch
# vergeben und war damit unvorhersagbar. Der Datenordner auf dem Server muss
# derselben Nummer gehören, sonst kann der Container nichts speichern:
#     sudo chown -R 1000:1000 /PFAD/ZUM/daten
RUN mkdir -p /app/daten && chown -R node:node /app
USER node

EXPOSE 8080

HEALTHCHECK --interval=60s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/info" > /dev/null || exit 1

CMD ["node", "server/server.js"]
