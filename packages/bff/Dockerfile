# Node.js 26.13.0-slim
FROM node@sha256:5adad64f9a1fca2d51972caa65983634c8a774eb300d72b20f7f2a0f60368072 AS build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g corepack@0.36.0 --ignore-scripts && corepack enable

WORKDIR /app
COPY . .

RUN pnpm install --frozen-lockfile

RUN pnpm turbo build

ARG BUILD_VERSION
ENV BUILD_VERSION=${BUILD_VERSION}

ENV PORT=80

EXPOSE $PORT
CMD [ "pnpm", "--filter", "bff", "run", "start" ]
