# Vendored `@digdir/dialogporten-schema` (PoC only)

This directory is a **proof-of-concept-only** copy of the `@digdir/dialogporten-schema` package, used by the
parent/child dialogs PoC (Altinn/dialogporten#4474) on branch `feat/dialog-children`. Do not merge it to `main`.

It was seeded from the published `1.120.0` package, with two fields hand-added to `type Dialog`
(after `precedingProcess`):

- `parentDialogId: UUID`
- `childDialogIds: [UUID!]`

The BFF references it as `"@digdir/dialogporten-schema": "file:./vendor/dialogporten-schema"` in
`packages/bff/package.json`. The real flow is to release a new schema package from Dialogporten and bump the version.

## Refreshing from the backend worktree

```bash
cd ~/repos/dialogporten/feat_dialog-relations/docs/schema/V1
./gql-to-js.sh                          # regenerates src/index.js from schema.verified.graphql
cp src/index.js ~/repos/dialogporten-frontend/packages/bff/vendor/dialogporten-schema/src/index.js
cd ~/repos/dialogporten-frontend && pnpm install   # file: deps are copied, so reinstall to pick up changes
```

Note that the backend worktree tracks Dialogporten `main`, which may contain other schema changes than the published
`1.120.0` package. Run `pnpm --filter bff-types-generated build` and `pnpm turbo typecheck` after refreshing.

## Docker

The BFF Dockerfile copies the whole repo (`COPY . .`) before `pnpm install --frozen-lockfile`, so this directory is
part of the build context and the `file:` dependency resolves inside the image. Compose watch syncs
`packages/bff/` but does not reinstall, so changes here need a rebuild of the `bff` container.
