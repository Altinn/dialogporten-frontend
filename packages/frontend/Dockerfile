FROM node:22.17.0-slim@sha256:b2fa526a10dad3c5ab4b3779eca81607ed05a96160ef5497c36cd4ebed68803d AS build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm i -g corepack@latest
RUN corepack enable

WORKDIR /app
COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm --filter frontend run build

# `EXPOSE`, `ENV` and `CMD` in this stage is only used for dev
EXPOSE 80
ENV PORT=80
CMD ["pnpm", "--filter", "frontend", "run", "dev", "--host", "0.0.0.0"]

# ---

FROM nginx:1.29-alpine@sha256:b2e814d28359e77bd0aa5fed1939620075e4ffa0eb20423cc557b375bd5c14ad

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
