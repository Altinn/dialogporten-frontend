FROM node:22.14.0-slim@sha256:1c18d9ab3af4585870b92e4dbc5cac5a0dc77dd13df1a5905cea89fc720eb05b AS build
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

FROM nginx:1.25-alpine
COPY --from=build /app/packages/docs/build/ /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

