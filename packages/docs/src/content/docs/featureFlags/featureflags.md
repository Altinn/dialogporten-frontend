---
title: 🏁 Feature Flags
---

### Quick overview

Feature flags let us enable or disable functionality dynamically **without redeploying the app**.  
They are defined once in the BFF and shared with the frontend. Their values are fetched from the BFF (`/api/features`) before the app starts, and refreshed every 20 minutes. The BFF itself refreshes its configuration every **10 seconds** to stay in sync with Azure App Configuration, ensuring near real-time updates across environments.

---

### Adding a Feature Flag

1. **Define it**  
   Add the flag to `featureFlagDefinitions` in  
   `./bff/src/features/featureFlagDefinitions.ts`.  
   This is the only place in the code. The BFF uses the list to decide which keys to load from Azure App Configuration
   and as a fallback if Azure is unreachable. The frontend imports the same list through `bff-types-generated`.
  - Each flag needs a `key`, `type`, and `default` value.
  - Valid types are:
    - `boolean` → simple on/off toggle, stored as a feature flag in Azure
    - `number`, `string` or `string-array` → stored as a key-value in Azure, see [Value settings](#value-settings)
  - Keys use **dot notation** to indicate scope or grouping, e.g.:
     ```
     profile.enableRoutes
     globalMenu.enableProfileLink
     ```
    This makes it easier to organize and reason about related flags.

2. **Configure it in Azure**  
   Add the key in Azure App Configuration for each environment. Where depends on the type:
  - `boolean` → [Feature Manager](https://learn.microsoft.com/en-us/azure/azure-app-configuration/manage-feature-flags?tabs=azure-portal).
    All feature flags live under the prefix `.appconfig.featureflag/<key>`, e.g.
    ```
    .appconfig.featureflag/profile.enableRoutes
    ```
  - Any other type → **Configuration explorer**, see [Value settings](#value-settings).
  - The key in Azure must match the key in `featureFlagDefinitions` exactly.
  - If the key is not in Azure for an environment, the BFF returns the `default` from `featureFlagDefinitions`.
    Once the key is in Azure, its value is used, also when it is `false`.

---

### Value settings

Flags with type `number`, `string` or `string-array` (currently only `auth.orgsNotReadyToDealWithDelegations`, a `string-array`)
are not Feature Manager flags. They are ordinary key-values in App Configuration:

- In Azure, add it under **Configuration explorer** as a key-value with the same key (no `.appconfig.featureflag/` prefix).
- An empty value counts as not set, and the default is used.
- For `string`, the value is used as is.
- For `number` and `string-array`, the BFF runs `JSON.parse` on the value, so it must be valid JSON, e.g. `42` or `["digdir","skd"]`.
  A value that does not parse is logged as a warning and the default is used.

---

### Nice to know

- Feature flags are **loaded before the app mounts** (if loading fails, defaults are used).
- Flags are exposed app-wide via `FeatureFlagProvider` and accessed through `useFeatureFlag()`.
- The frontend merges the **shared definitions** and **BFF-provided values** (missing keys always fall back to defaults).
- The BFF uses **Azure App Configuration + Microsoft Feature Management SDK** under the hood.
- For Azure setup and troubleshooting, see:  
  [Microsoft Docs: Manage Feature Flags in Azure App Configuration](https://learn.microsoft.com/en-us/azure/azure-app-configuration/manage-feature-flags?tabs=azure-portal)
