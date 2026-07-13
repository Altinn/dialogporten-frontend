FROM node:22.23.1-slim@sha256:53ada149d435c38b14476cb57e4a7da73c15595aba79bd6971b547ceb6d018bf AS build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app
COPY . .

RUN pnpm install --frozen-lockfile

RUN pnpm turbo build

ENV PORT=80

EXPOSE $PORT
CMD [ "pnpm", "--filter", "bff", "run", "start" ]
