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

FROM nginx:1.29-alpine@sha256:b2e814d28359e77bd0aa5fed1939620075e4ffa0eb20423cc557b375bd5c14ad
COPY --from=build /app/packages/docs/build/ /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

