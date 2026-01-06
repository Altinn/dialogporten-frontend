# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dialogporten Frontend is a Norwegian government digital communication platform frontend. It's a monorepo using pnpm workspaces with a React SPA frontend, a Fastify BFF (Backend for Frontend) with GraphQL, and supporting packages.

## Build & Development Commands

### Quick Reference
```bash
# Install dependencies
pnpm install

# Type checking
pnpm turbo typecheck

# Run tests
pnpm turbo test

# Build for production
pnpm turbo build

# Code formatting/linting
pnpm biome:fix              # Fix all files
pnpm biome:fix-staged       # Fix staged files only
```

### Local Development with Docker
```bash
make dev                    # Start all services in watch mode
make compose-down           # Stop containers
```

Services available at:
- App: https://app.localhost
- Docs: https://docs.localhost
- GraphQL IDE: https://app.localhost/api/graphql

### Frontend Package (`packages/frontend`)
```bash
pnpm dev                    # Vite dev server
pnpm test                   # Unit tests (Vitest)
pnpm test:watch             # Tests in watch mode
pnpm test:playwright        # E2E tests (desktop)
pnpm test:playwright:mobile # E2E tests (mobile)
pnpm test:accessibility     # Accessibility tests
pnpm i18n:check             # Check translation completeness
```

Running a single Playwright test:
```bash
pnpm test:playwright -g 'myStory.spec.ts'
```

### BFF Package (`packages/bff`)
```bash
pnpm dev                    # Start with file watching
pnpm test                   # Unit tests
pnpm typeorm                # TypeORM CLI
```

## Architecture

```
Frontend (React 19/Vite)
        │
        │ GraphQL (graphql-request) + SSE subscriptions
        ▼
BFF (Fastify/GraphQL)
        │
   ┌────┴────┬─────────────┐
   ▼         ▼             ▼
PostgreSQL  Redis     Dialogporten API
(TypeORM)   (Sessions) (Schema Stitched)
```

**Key architectural patterns:**
- BFF uses GraphQL schema stitching to combine local schema (Nexus) with external Dialogporten API
- Authentication via ID-porten OIDC with server-side sessions in Redis
- React Query for data fetching and caching
- Real-time updates via Server-Sent Events (SSE)
- i18next with ICU message format for internationalization

## Key Directories

- `packages/frontend/src/pages/` - Page components (Inbox, DialogDetailsPage, Profile, etc.)
- `packages/frontend/src/components/` - Reusable React components
- `packages/frontend/src/api/` - GraphQL queries and API hooks
- `packages/frontend/tests/` - Playwright E2E and accessibility tests
- `packages/bff/src/graphql/` - GraphQL schema and types (Nexus)
- `packages/bff/src/auth/` - OIDC authentication flows
- `packages/bff/src/migrations/` - TypeORM database migrations
- `.azure/` - Bicep infrastructure code

## Code Conventions

- **Formatting**: Biome (120 char line width, 2 spaces, single quotes JS/double quotes JSX, semicolons always)
- **Components**: Functional components with hooks, `.tsx` extension, CSS Modules for styling
- **Console logs**: `noConsoleLog` rule enforced - use the node-logger package instead
- **GraphQL**: Nexus for type-safe schema definition in BFF
- **Testing**: Vitest for unit tests, Playwright for E2E, axe-core for accessibility

## Mock Data for Testing

Access mock data in browser: `https://app.localhost/?mock=true`

With specific dataset: `https://app.localhost/?mock=true&playwrightId=<folder-name>`

Mock data location: `packages/frontend/src/mocks/data`

## Environment Setup

Requires Node 22+, pnpm, and Docker. Create `.env` in root with:
```
OIDC_CLIENT_ID=<value>
OIDC_CLIENT_SECRET=<value>
ENABLE_NEW_OIDC='true'
OCP_APIM_SUBSCRIPTION_KEY=<value>
APP_CONFIG_CONNECTION_STRING=<value>
AUTH_CONTEXT_COOKIE_DOMAIN='localhost'
# ... additional variables as needed
```

## Diagrams

Create diagrams using https://excalidraw.com/ - save both `.excalidraw` and `.svg` versions in the same directory.
