---
title: "Dependencies"
---
## Shared versions (pnpm catalog)

Dependencies used by two or more packages get their version in the `catalog:` section of `pnpm-workspace.yaml`,
and each package references them as `"<dep>": "catalog:"`.

- A dependency used by one package only: set the version directly in that package's `package.json`.
- A dependency that is (or is about to be) used by more than one package: move it to the catalog and reference it as `catalog:` from every package.
- To bump a shared version, change it in the catalog. Do not pin a single package to another version.

## Renovate

`renovate.json` extends Altinn's shared config (`local>Altinn/renovate-config`) with `rangeStrategy: pin`.
Renovate opens PRs for version updates and security fixes.

## Supply-chain guards

`pnpm-workspace.yaml` has two settings that make `pnpm install` reject some ordinary upgrades:

- `minimumReleaseAge: 1440` refuses versions published less than one day (1440 minutes) ago,
  with `ERR_PNPM_NO_MATURE_MATCHING_VERSION`. Wait, or pin the newest version that is old enough.
- `trustPolicy: no-downgrade` refuses a version with weaker npm provenance than earlier versions of the same package,
  with `ERR_PNPM_TRUST_DOWNGRADE`.

`minimumReleaseAgeExclude` and `trustPolicyExclude` are escape hatches. Only add an entry with a concrete reason,
and write the reason as a comment next to it.

## Fixing vulnerabilities in transitive dependencies

1. **Check the parent's range** with `npm view <parent>@<version> dependencies.<pkg>`.
2. **If the range already allows the fixed version**, only the lockfile needs to change.
   `pnpm update -r <pkg>` usually fails here, because it also re-resolves unrelated packages and trips `trustPolicy`. This works instead:
   1. Temporarily add an exact override for the package under `pnpm.overrides` in the root `package.json`, e.g. `"pkg@4": "4.3.1"`.
   2. Run `pnpm install`.
   3. Restore `package.json` exactly as it was.
   4. Run `pnpm install` again. The lockfile keeps the fixed version.
   5. Diff the lockfile and check that only the intended packages moved.
3. **Only if the range excludes the fixed version**, add a permanent override in the root `package.json`, bounded to the major:
   `"js-yaml@4": ">=4.3.1 <5"`. An open range like `">=4.3.1"` can jump to a new major and break the parent.
4. Remove permanent overrides when the parent has caught up.
