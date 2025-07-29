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

RUN pnpm turbo build

ENV PORT=80

EXPOSE $PORT
CMD [ "pnpm", "--filter", "bff", "run", "start" ]
