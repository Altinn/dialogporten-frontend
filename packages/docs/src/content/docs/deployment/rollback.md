---
title: "Rollback"
---
What to do when a release causes problems, in order of preference.

## 1. Turn off the feature flag

If the problem is in functionality behind a feature flag, turn the flag off in Azure App Configuration for the environment.
No deploy is needed. The BFF picks up the change within about 10 seconds, and the frontend on the next page load or within 20 minutes.
See [Feature Flags](../../featureflags/featureflags/).

## 2. Deploy the previous version

### Production

**CI/CD Production** (`ci-cd-prod.yml`) only moves forward. It fails if the version is older than the apps or infrastructure version stored for production (`LATEST_DEPLOYED_APPS_VERSION` and `LATEST_DEPLOYED_INFRA_VERSION`). Redeploying the same version is allowed.

To roll back, run **Deploy Apps (Manual)** (`dispatch-deploy-apps.yml`):

- Set environment to `prod` and version to the previous version number, without the `v` (e.g. `1.181.0`).
- Select the tag `v<version>` under "Use workflow from" so the Bicep templates match the image.
- If the release you roll back from changed infrastructure, also run **Deploy Infrastructure (Manual)** (`dispatch-deploy-infrastructure.yml`) with the same version. It deploys from the tag `v<version>`.

The manual workflows do not update the manifests repository or the stored deployed version. After a rollback:

- The stored version is still the release you rolled back from, so the next CI/CD Production deploy must use that version or a newer one.
- Change detection in that deploy compares `main` against the release you rolled back from, not the version running in production.
  If nothing relevant changed since then, the apps or infrastructure are skipped and production stays on the rolled-back version. **Check in the run that "Deploy apps to prod" actually ran.**

### Other environments

Use **Deploy Apps (Manual)** as described above. Test (`at23`) is redeployed from `main` on the next merge, so a revert commit is often simpler there.

## 3. Database migrations

Migrations only run forward. The migration job calls `dataSource.runMigrations()` (`packages/bff/src/run-migration.ts`), which applies pending migrations, and nothing in the pipelines runs `down`.

- Deploying an older version does not undo a migration. The old code runs against the new schema.
  If the migration job runs during a rollback, it does nothing, since the old image only knows migrations that are already applied.
- Every migration must therefore work with the previous release: add nullable columns or columns with a default, and do not rename or drop anything in the same release as the code that stops using it. Drop it in a later release.
- Before rolling back, check whether the release you roll back from added files in `packages/bff/src/migrations/`.
- If a migration really must be reverted, it has to be done by hand against the database (TypeORM `migration:revert`) through the database forwarder (see [Infrastructure](../infrastructure/)). This is not scripted. Agree on it with the team before touching production.
