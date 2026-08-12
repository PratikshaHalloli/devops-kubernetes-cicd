FROM node:22-alpine AS dependencies

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev


FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY --from=dependencies /app/node_modules ./node_modules
COPY package*.json ./
COPY server.js ./

RUN addgroup -S -g 1001 appgroup && \
    adduser -S -u 1001 -G appgroup appuser

USER 1001

EXPOSE 3000

CMD ["node", "server.js"]
