# Node.js 26.13.0-slim
FROM node@sha256:5adad64f9a1fca2d51972caa65983634c8a774eb300d72b20f7f2a0f60368072 AS build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g corepack@0.36.0 --ignore-scripts && corepack enable
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

# nginx 1.31.9-alpine
FROM nginx@sha256:90b6bd2aec278b16b98221d64deb1d6d35d164567f507ab0716e6053878315aa AS nginx

# Copy the generated frontend build
COPY --from=build /app/packages/frontend/dist/ /usr/share/nginx/html/

# Copy nginx configuration
COPY ./packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Add the startup script
COPY --chmod=755 ./packages/frontend/start.sh /start.sh

RUN sed -i -e '/^user /d' -e 's#^pid .*#pid /tmp/nginx.pid;#' /etc/nginx/nginx.conf \
  && mv /usr/share/nginx/html/index.html /usr/share/nginx/index.html.template \
  && install -o nginx -g nginx -m 644 /dev/null /usr/share/nginx/html/index.html \
  && chown -R nginx:nginx /var/cache/nginx

USER 101

# Expose port 8080
EXPOSE 8080

# Use the custom entrypoint script
CMD ["/start.sh"]
