---
title: "Github actions"
---
Naming conventions for github actions:
- `ci-cd-*.yml`: Workflows that are triggered by an event
- `dispatch-*.yml`: Workflows that are dispatchable
- `workflow-*.yml`: Reusable workflows

The `workflow-check-for-changes.yml` workflow uses the `tj-actions/changed-files` action to check which files have been altered since last commit or tag. We use this filter to ensure we only deploy backend code or infrastructure if the respective files have been altered. 

In `ci-cd-prod.yml` the base is the last version deployed to production, and the comparison is made against the branch the workflow is started from, not against the version being deployed. Changes under `.github/` count as both infrastructure and application changes.
