# Build context is the repository root (npm workspaces - see server/Dockerfile).
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY client/package.json client/package.json
COPY server/package.json server/package.json

# Vite is a devDependency, so this stage deliberately installs them.
RUN npm ci --workspace @pizza-house/client --include-workspace-root

COPY client ./client

# Baked in at build time by Vite. The default assumes the web container
# proxies /api to the API service (see client/nginx.conf).
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build --workspace @pizza-house/client

FROM nginx:1.27-alpine

COPY client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/client/dist /usr/share/nginx/html

EXPOSE 80
