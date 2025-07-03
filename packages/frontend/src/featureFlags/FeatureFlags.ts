export enum FeatureFlagKeys {
  EnableDebugHeaderScreen = 'EnableDebugHeaderScreen',
  DisableBulkActions = 'DisableBulkActions',
  DisableFavoriteGroups = 'DisableFavoriteGroups',
}

export interface FeatureFlags {
  [FeatureFlagKeys.EnableDebugHeaderScreen]: boolean;
  [FeatureFlagKeys.DisableBulkActions]: boolean;
  [FeatureFlagKeys.DisableFavoriteGroups]: boolean;
}

export const featureFlags: FeatureFlags = {
  [FeatureFlagKeys.EnableDebugHeaderScreen]: true,
  [FeatureFlagKeys.DisableBulkActions]: true,
  [FeatureFlagKeys.DisableFavoriteGroups]: true,
};
