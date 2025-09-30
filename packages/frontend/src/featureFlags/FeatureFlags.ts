export enum FeatureFlagKeys {
  EnableDebugHeaderScreen = 'EnableDebugHeaderScreen',
  DisableBulkActions = 'DisableBulkActions',
  DisableFavoriteGroups = 'DisableFavoriteGroups',
  EnableProfilePages = 'EnableProfilePages',
  EnableProfileLinkInGlobalMenu = 'EnableProfileLinkInGlobalMenu',
  EnableAccessManagementLinkInGlobalMenu = 'EnableAccessManagementLinkInGlobalMenu',
}

export interface FeatureFlags {
  [FeatureFlagKeys.EnableDebugHeaderScreen]: boolean;
  [FeatureFlagKeys.DisableBulkActions]: boolean;
  [FeatureFlagKeys.DisableFavoriteGroups]: boolean;
  [FeatureFlagKeys.EnableProfilePages]: boolean;
  [FeatureFlagKeys.EnableProfileLinkInGlobalMenu]: boolean;
  [FeatureFlagKeys.EnableAccessManagementLinkInGlobalMenu]: boolean;
}

export const featureFlags: FeatureFlags = {
  [FeatureFlagKeys.EnableDebugHeaderScreen]: true,
  [FeatureFlagKeys.DisableBulkActions]: true,
  [FeatureFlagKeys.DisableFavoriteGroups]: true,
  [FeatureFlagKeys.EnableProfilePages]: !location.hostname.includes('af.altinn.no'),
  [FeatureFlagKeys.EnableProfileLinkInGlobalMenu]: import.meta.env.DEV || location.hostname.includes('af.altinn.no'),
  [FeatureFlagKeys.EnableAccessManagementLinkInGlobalMenu]:
    import.meta.env.DEV || location.hostname.includes('af.altinn.no'),
};
