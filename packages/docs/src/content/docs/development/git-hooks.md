---
title: "Git Hooks"
---
This project have setup a `pre-commit` hook that can automatically run.
To enable this on your machine run the following command after cloning the repo:

```bash
pnpm hooks:enable
```

If you ever clone the repo again you'll have to re-run that command.

If you for whatever reason want to disable it you can run `pnpm hooks:disable`.
And you can check if its enabled or not with `pnpm hooks:status`.

Currently the `pre-commit` hook uses `Biome` to run formatter and linting.

In order to skip the hook run `git commit --no-verify`.
