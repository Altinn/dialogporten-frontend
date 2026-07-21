FROM node:24.18.0-slim@sha256:6f7b03f7c2c8e2e784dcf9295400527b9b1270fd37b7e9a7285cf83b6951452d AS build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
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

FROM nginx:1.31-alpine@sha256:4a73073bd557c65b759505da037898b61f1be6cbcc3c2c3aeac22d2a470c1752 AS nginx

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
