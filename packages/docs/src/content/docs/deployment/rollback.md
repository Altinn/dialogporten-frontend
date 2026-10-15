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

Run **CI/CD Production** (`ci-cd-prod.yml`) with the previous version number, without the `v` (e.g. `1.181.0`).

- It checks that the tag `v<version>` exists.
- It deploys infrastructure and apps from that tag (Bicep templates and images), uploads source maps, updates the manifests repository and stores the deployed version.
- Infrastructure and apps are only deployed when change detection finds changes. Change detection compares the version currently in production with the branch the workflow is started from, not with the version you deploy.
  If `main` has no application changes since the version in production, the apps are skipped. **Check in the run that "Deploy apps to prod" actually ran.**

If the apps were skipped, run **Deploy Apps (Manual)** (`dispatch-deploy-apps.yml`) with environment `prod` and the version, and select the tag `v<version>` under "Use workflow from" so the Bicep templates match the image.
This workflow does not update the manifests repository or the stored deployed version, so the next production deploy compares against the wrong base. Prefer CI/CD Production when it works.

### Other environments

Use **Deploy Apps (Manual)** as described above. Test (`at23`) is redeployed from `main` on the next merge, so a revert commit is often simpler there.

## 3. Database migrations

Migrations only run forward. The migration job calls `dataSource.runMigrations()` (`packages/bff/src/run-migration.ts`), which applies pending migrations, and nothing in the pipelines runs `down`.

- Deploying an older version does not undo a migration. The old code runs against the new schema.
  If the migration job runs during a rollback, it does nothing, since the old image only knows migrations that are already applied.
- Every migration must therefore work with the previous release: add nullable columns or columns with a default, and do not rename or drop anything in the same release as the code that stops using it. Drop it in a later release.
- Before rolling back, check whether the release you roll back from added files in `packages/bff/src/migrations/`.
- If a migration really must be reverted, it has to be done by hand against the database (TypeORM `migration:revert`) through the database forwarder (see [Infrastructure](../infrastructure/)). This is not scripted. Agree on it with the team before touching production.
