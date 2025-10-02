export enum FeatureFlagKeys {
  EnableDebugHeaderScreen = 'EnableDebugHeaderScreen',
  DisableBulkActions = 'DisableBulkActions',
  EnableProfilePages = 'EnableProfilePages',
  EnableProfileLinkInGlobalMenu = 'EnableProfileLinkInGlobalMenu',
  EnableAccessManagementLinkInGlobalMenu = 'EnableAccessManagementLinkInGlobalMenu',
}

export interface FeatureFlags {
  [FeatureFlagKeys.EnableDebugHeaderScreen]: boolean;
  [FeatureFlagKeys.DisableBulkActions]: boolean;
  [FeatureFlagKeys.EnableProfilePages]: boolean;
  [FeatureFlagKeys.EnableProfileLinkInGlobalMenu]: boolean;
  [FeatureFlagKeys.EnableAccessManagementLinkInGlobalMenu]: boolean;
}

export const featureFlags: FeatureFlags = {
  [FeatureFlagKeys.EnableDebugHeaderScreen]: true,
  [FeatureFlagKeys.DisableBulkActions]: true,
  [FeatureFlagKeys.EnableProfilePages]: !location.hostname.includes('af.altinn.no'),
  [FeatureFlagKeys.EnableProfileLinkInGlobalMenu]:
    import.meta.env.DEV || location.hostname.includes('af.at.altinn.cloud'),
  [FeatureFlagKeys.EnableAccessManagementLinkInGlobalMenu]:
    import.meta.env.DEV || location.hostname.includes('af.at.altinn.cloud'),
};
