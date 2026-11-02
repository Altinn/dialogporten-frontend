FROM node:24.15.0-slim@sha256:4e6b70dd6cbfc88c8157ba19aa3d9f9cce6ba4703576d55459e45efcbc9c5f5d AS build
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

FROM nginx:1.25-alpine@sha256:516475cc129da42866742567714ddc681e5eed7b9ee0b9e9c015e464b4221a00 AS nginx

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
