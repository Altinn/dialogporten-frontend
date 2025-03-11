# CI/CD Version Tracking and Change Detection

## 1. Version Storage Purpose
- GitHub environment variables store the latest deployed versions for each environment
- Separate tracking for:
  - Infrastructure version (`LATEST_DEPLOYED_INFRA_VERSION`)
  - Applications version (`LATEST_DEPLOYED_APPS_VERSION`)
- This enables accurate detection of what needs to be deployed in each environment

## 2. Change Detection Process (`workflow-check-for-changes.yml`)

1. **Version Comparison**
   - Retrieves latest deployed versions from GitHub environment variables
   - Compares current deployment version with last deployed version
   - Uses git commit SHAs to determine exact changes between versions

2. **Change Categories Tracked**
   ```yaml
   Changes detected in:
   - Infrastructure (Azure resources, GitHub workflows)
   - Backend code
   - Node logger
   - Database migrations
   ```

3. **Smart Deployment Decisions**
   - Only deploys components that have actually changed
   - Infrastructure deployment skipped if no infrastructure changes
   - App deployment skipped if no application changes
   - Migrations run only when database changes exist
   - Node logger published only on node-logger changes

## 3. Implementation Example

```yaml
# Getting latest deployed versions
get-versions-from-github:
  name: Get Latest Deployed Version Info from GitHub
  uses: ./.github/workflows/workflow-get-latest-deployed-version-info-from-github.yml
  with:
    environment: prod
  secrets:
    GH_TOKEN: ${{ secrets.RELEASE_VERSION_STORAGE_PAT }}

# Checking for changes
check-for-changes:
  name: Check for changes
  needs: [get-versions-from-github]
  uses: ./.github/workflows/workflow-check-for-changes.yml
  with:
    infra_base_sha: ${{ needs.get-versions-from-github.outputs.infra_version_sha }}
    apps_base_sha: ${{ needs.get-versions-from-github.outputs.apps_version_sha }}
```

## 4. Example Workflow

1. **New Release Created (v1.2.3)**
   ```plaintext
   Current State:
   - Production: v1.2.1
   - Changes detected:
     • Infrastructure: No changes
     • Backend code: Modified
     • Database: New migration
   ```

2. **Deployment Process**
   ```plaintext
   Actions:
   - Skip infrastructure deployment
   - Deploy new application version
   - Run database migration
   - Update LATEST_DEPLOYED_APPS_VERSION to v1.2.3
   ```

3. **After Deployment**
   ```plaintext
   New State:
   - LATEST_DEPLOYED_INFRA_VERSION remains at v1.2.1
   - LATEST_DEPLOYED_APPS_VERSION updated to v1.2.3
   ```
   