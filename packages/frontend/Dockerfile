FROM node:22.21.1-slim@sha256:7378f5a4830ef48eb36d1abf4ef398391db562b5c41a0bded83192fbcea21cc8 AS build
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

FROM nginx:1.29-alpine@sha256:8491795299c8e739b7fcc6285d531d9812ce2666e07bd3dd8db00020ad132295 AS nginx

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
