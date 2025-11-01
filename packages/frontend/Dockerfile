FROM node:22.21.1-slim@sha256:7e3a5fac109e00e9f2616cd24f5227e2eb0d473bf33b98d661b0c1862f6bfbbd AS build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm i -g corepack@latest
RUN corepack enable

# Accept build version as build argument
ARG BUILD_VERSION
ENV BUILD_VERSION=${BUILD_VERSION}

WORKDIR /app
COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm --filter frontend run build

# `EXPOSE`, `ENV` and `CMD` in this stage is only used for dev
EXPOSE 80
ENV PORT=80
CMD ["pnpm", "--filter", "frontend", "run", "dev", "--host", "0.0.0.0"]

# ---

FROM nginx:1.28-alpine@sha256:30f1c0d78e0ad60901648be663a710bdadf19e4c10ac6782c235200619158284

# Install envsubst for environment variable substitution
RUN apk add --no-cache gettext

# Copy the generated frontend build
COPY --from=build /app/packages/frontend/dist/ /usr/share/nginx/html/

# Copy nginx configuration
COPY ./packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Add the startup script
COPY ./packages/frontend/start.sh /start.sh
RUN chmod +x /start.sh

# Expose port 80
EXPOSE 80

# Use the custom entrypoint script
CMD ["/start.sh"]
