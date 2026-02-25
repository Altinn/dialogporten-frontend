---
name: update-environment-variables
description: Use when adding or changing environment variables in this repository (frontend runtime config and deployment wiring).
---

# Update Environment Variables

Use this skill when a change requires adding, removing, or modifying environment variables.

Primary reference:
- [`packages/docs/docs/development/environment+variables.md`](../../../packages/docs/docs/development/environment+variables.md)

## Frontend Runtime Variables

When the value is injected at container startup, update all of these:
1. `packages/frontend/src/config.ts`
2. `packages/frontend/index.html` (`window.*` placeholder)
3. `packages/frontend/start.sh` (`envsubst` variable list)

## Deployment Wiring (Frontend)

When the variable must be set in Azure deployment:
1. `.azure/applications/frontend/main.bicep` (param + `environmentVariables`)
2. `.azure/applications/frontend/*.bicepparam` (explicit value or `readEnvironmentVariable(...)`)
3. `.github/workflows/workflow-deploy-apps.yml` (only if param value comes from workflow env/secrets/vars)

## Validation

Run:
```bash
pnpm --filter frontend typecheck
pnpm --filter frontend build
az bicep build --file .azure/applications/frontend/main.bicep
```

If broader verification is needed, run:
```bash
pnpm turbo build
```
