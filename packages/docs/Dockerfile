FROM node:22-slim AS build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV CI=true
RUN npm i -g corepack@latest
RUN corepack enable

# Copy altinn-components to root to match the file path reference
COPY altinn-components/ /altinn-components/
# Build altinn-components first
WORKDIR /altinn-components
# Clear pnpm cache and install with force to ensure correct native binaries
RUN pnpm store prune && rm -rf node_modules pnpm-lock.yaml
RUN pnpm install --force && pnpm run build
# Now proceed with main project
WORKDIR /app
COPY dialogporten-frontend/ ./

RUN pnpm install --frozen-lockfile

RUN pnpm --filter docs run build

# For dev
EXPOSE 80
CMD ["pnpm", "--filter", "docs", "run", "start", "--port", "80", "--host", "0.0.0.0"]

# ---

FROM nginx:1.25-alpine
COPY --from=build /app/packages/docs/build/ /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

