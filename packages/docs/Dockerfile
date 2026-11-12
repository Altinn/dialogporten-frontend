# Node.js 26.13.0-slim
FROM node@sha256:5adad64f9a1fca2d51972caa65983634c8a774eb300d72b20f7f2a0f60368072 AS build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV ASTRO_TELEMETRY_DISABLED=1
RUN npm install -g corepack@0.36.0 --ignore-scripts && corepack enable

WORKDIR /app
COPY . .

RUN pnpm install --frozen-lockfile

RUN pnpm --filter docs run build

# For dev
EXPOSE 80
CMD ["pnpm", "--filter", "docs", "run", "dev", "--port", "80", "--host", "0.0.0.0"]

# ---

# nginx 1.25.5-alpine
FROM nginx@sha256:516475cc129da42866742567714ddc681e5eed7b9ee0b9e9c015e464b4221a00
COPY --from=build /app/packages/docs/dist/ /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

