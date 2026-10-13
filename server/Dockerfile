# Build context is the repository root, because the lockfile that pins these
# dependencies lives there (npm workspaces).
FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

# Manifests first, so a code-only change reuses the dependency layer.
COPY package.json package-lock.json ./
COPY server/package.json server/package.json
COPY client/package.json client/package.json

RUN npm ci --omit=dev --workspace @pizza-house/server --include-workspace-root \
  && npm cache clean --force

COPY server ./server

# node:alpine ships an unprivileged `node` user; don't run the API as root.
USER node

EXPOSE 5000

CMD ["node", "server/server.js"]
