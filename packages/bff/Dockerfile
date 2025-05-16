FROM node:22.15.1-slim@sha256:ec318fe0dc46b56bcc1ca42a202738aeb4f3e347a7b4dd9f9f1df12ea7aa385a AS build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm i -g corepack@latest
RUN corepack enable

WORKDIR /app
COPY . .

RUN pnpm install --frozen-lockfile

RUN pnpm turbo build

ENV PORT=80

EXPOSE $PORT
CMD [ "pnpm", "--filter", "bff", "run", "start" ]
