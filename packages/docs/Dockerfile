FROM node:22-slim AS build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm i -g corepack@latest
RUN corepack enable

WORKDIR /app
COPY . .

RUN pnpm install --frozen-lockfile

RUN pnpm --filter docs run build

# For dev
EXPOSE 80
CMD ["pnpm", "--filter", "docs", "run", "start", "--port", "80", "--host", "0.0.0.0"]

# ---

FROM nginx:1.27-alpine@sha256:4ff102c5d78d254a6f0da062b3cf39eaf07f01eec0927fd21e219d0af8bc0591
COPY --from=build /app/packages/docs/build/ /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

