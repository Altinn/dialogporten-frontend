export enum FeatureFlagKeys {
  EnableDebugHeaderScreen = 'EnableDebugHeaderScreen',
  DisableBulkActions = 'DisableBulkActions',
  DisableFavoriteGroups = 'DisableFavoriteGroups',
  EnableProfilePages = 'EnableProfilePages',
}

export interface FeatureFlags {
  [FeatureFlagKeys.EnableDebugHeaderScreen]: boolean;
  [FeatureFlagKeys.DisableBulkActions]: boolean;
  [FeatureFlagKeys.DisableFavoriteGroups]: boolean;
  [FeatureFlagKeys.EnableProfilePages]: boolean;
}

export const featureFlags: FeatureFlags = {
  [FeatureFlagKeys.EnableDebugHeaderScreen]: true,
  [FeatureFlagKeys.DisableBulkActions]: true,
  [FeatureFlagKeys.DisableFavoriteGroups]: true,
  [FeatureFlagKeys.EnableProfilePages]: !location.hostname.includes('af.altinn.no'),
};
