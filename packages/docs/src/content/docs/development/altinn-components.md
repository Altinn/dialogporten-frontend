---
title: "Testing altinn-components changes"
---
Shared UI changes belong in [altinn-components](https://github.com/Altinn/altinn-components), and the place to build and review them is its Storybook.
When you also need to see a change inside Arbeidsflate before it is published, install it as a packed tarball and run the frontend against mock data.

## Recommended: tarball and `pnpm dev` with mock data

- **The tarball is exactly what would be published:** the build output, the `files` list, the types and the CSS.
  It catches problems Storybook does not, such as missing exports or type changes that break Arbeidsflate.
- **`pnpm dev` in `packages/frontend` with `?mock=true`** needs no login, BFF or Docker, and the mock datasets cover most UI states.

:::caution
The commands below assume the following setup. If yours is different, adjust the paths and commands to match:

- Clone `altinn-components` next to `dialogporten-frontend`.
- Use Node 24, which `altinn-components` requires (`.node-version`).
- Rebase your `altinn-components` branch on the latest `main`. The tarball replaces the version Arbeidsflate uses,
  so if your branch is behind, you also lose the fixes that have been released since.

### 1. Build and pack

In `altinn-components`:

```bash
pnpm build
pnpm pack --pack-destination ../dialogporten-frontend/packages/frontend/local
```

### 2. Install the tarball

In `packages/frontend`:

```bash
pnpm add ./local/altinn-altinn-components-<version>.tgz
```

`package.json` now points to `file:local/...`. Git ignores `*.tgz`, so the tarball itself never shows up as a change.

### 3. Run with mock data

In `packages/frontend`:

```bash
pnpm dev
```

Open `http://localhost:5173/?mock=true`, optionally with `&playwrightId=<folder>` to pick a dataset from `src/mocks/data/stories`.

With the tarball installed, these also run against your local version:

- `pnpm typecheck` checks Arbeidsflate against the new types.
- `pnpm test` and `pnpm test:playwright`. Playwright starts `pnpm dev` itself, or reuses one that is already running.

### 4. After the next change

Build and pack again (step 1). Packing again with the same version number is fine. Then, in `packages/frontend`:

```bash
pnpm install
```

Restart the dev server. If it still shows the old code, start Vite with a fresh dependency cache:

```bash
pnpm exec vite --force
```

or change filename of pack.

### 5. Clean up before committing

In `packages/frontend`:

```bash
git checkout -- package.json ../../pnpm-lock.yaml
pnpm install
```

Never commit `file:local/...`. CI does not have the tarball, and every install would fail.
When the change is published, bump `@altinn/altinn-components` to the new version as usual.

## Not supported: Docker with real login

The Docker setup (`make dev`) is not set up for local packages, and we have not needed it so far.
Every image installs the whole workspace from the lockfile, so a local tarball affects all of them.
If you really need to test with real login, this workaround should work. It is untested and not maintained:

1. Do steps 1 and 2 above. The tarball must be in `packages/frontend/local` with the relative `file:local/...` path.
   An absolute path does not exist inside the containers and breaks `pnpm install --frozen-lockfile` in every image.
2. Rebuild the images. With `make dev` running, the lockfile change triggers a rebuild of `bff`, `frontend` and `docs`.
   Otherwise run `docker compose build`.

Be aware that:

- Every new tarball changes the lockfile and rebuilds three images, which takes minutes per round.
- The BFF image runs `pnpm turbo build` for the whole workspace. If the frontend build fails with the tarball, the BFF container fails too.
- If you forget `pnpm install` after packing again, the lockfile does not change and the containers keep the old version without any warning.
- Clean up as in step 5, and rebuild the images again afterwards.
