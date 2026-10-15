---
title: 🏁 Feature Flags
---

### Quick overview

Feature flags let us enable or disable functionality dynamically **without redeploying the app**.  
They are defined in the frontend, but their values are fetched from the BFF (`/api/features`) before the app starts, and refreshed every 20 minutes. The BFF itself refreshes its configuration every **10 seconds** to stay in sync with Azure App Configuration, ensuring near real-time updates across environments.

---

### Adding a Feature Flag

1. **Define it in the frontend**  
   Add the flag to `featureFlagDefinitions` in  
   `./frontend/src/featureFlags/FeatureFlags.ts`.
  - Each flag needs a `key`, `type`, and `default` value.
  - Valid types are:
    - `boolean` → simple on/off toggle
    - `number` or `string` → variant flags (e.g., `"theme.variant" = "dark"`)
    - `string-array` → list of values (e.g., `auth.orgsNotReadyToDealWithDelegations`), see [Value settings](#value-settings)
    -  Keys use **dot notation** to indicate scope or grouping, e.g.:
     ```
     profile.enableRoutes
     globalMenu.enableProfileLink
     ```
    This makes it easier to organize and reason about related flags.

2. **Register it in the BFF**  
   Add the same key (with a matching default value) to  
   `defaultFeatureFlags` in  
   `./bff/src/features/featureApi.ts`.  
   This ensures the BFF always has a fallback if Azure App Config is unreachable.  
   The BFF only loads keys listed here. If you forget this step, the flag is never read from Azure
   and the frontend silently uses its default value.

3. **Configure it in Azure**  
   Add the key in [Azure App Configuration’s Feature Manager](https://learn.microsoft.com/en-us/azure/azure-app-configuration/manage-feature-flags?tabs=azure-portal) for each environment.
  - The key in Azure must match the frontend key exactly.
  - All feature flags in Azure live under the prefix  
    `.appconfig.featureflag/<key>`.
  - Example:
    ```
    .appconfig.featureflag/profile.enableRoutes
    ```

---

### Value settings

Flags that are not on/off toggles (currently only `auth.orgsNotReadyToDealWithDelegations`, a `string-array`)
are not Feature Manager flags. They are ordinary key-values in App Configuration. This applies to any
non-`boolean` type, since the BFF only resolves `boolean` keys through the Feature Manager:

- Register the key in `defaultAppConfigValues` (not `defaultFeatureFlags`) in `./bff/src/features/featureApi.ts`.
- In Azure, add it under **Configuration explorer** as a key-value with the same key (no `.appconfig.featureflag/` prefix).
- The BFF runs `JSON.parse` on the value, so it must be valid JSON, e.g. `["digdir","skd"]`. A value that does not parse is logged as a warning and the default is used.

---

### Nice to know

- Feature flags are **loaded before the app mounts** (if loading fails, defaults are used).
- Flags are exposed app-wide via `FeatureFlagProvider` and accessed through `useFeatureFlag()`.
- The frontend merges **client definitions** and **BFF-provided values** (missing keys always fall back to defaults).
- The BFF uses **Azure App Configuration + Microsoft Feature Management SDK** under the hood.
- For Azure setup and troubleshooting, see:  
  [Microsoft Docs: Manage Feature Flags in Azure App Configuration](https://learn.microsoft.com/en-us/azure/azure-app-configuration/manage-feature-flags?tabs=azure-portal)
