export type FeatureFlagType = 'boolean' | 'number' | 'string' | 'string-array';

export type FeatureFlagValue = boolean | number | string | readonly string[];

export type FeatureFlagDefinition =
  | { key: string; type: 'boolean'; default: boolean }
  | { key: string; type: 'number'; default: number }
  | { key: string; type: 'string'; default: string }
  | { key: string; type: 'string-array'; default: readonly string[] };

export const featureFlagDefinitions = [
  { key: 'dialogporten.disableFlipNamesPatch', type: 'boolean', default: false },
  { key: 'inbox.enableAlertBanner', type: 'boolean', default: false },
  { key: 'inbox.enableExportSearchResults', type: 'boolean', default: false },
  { key: 'dialogporten.disableSubscriptions', type: 'boolean', default: false },
  { key: 'auth.orgsNotReadyToDealWithDelegations', type: 'string-array', default: [] },
  { key: 'profil.enableSIPhoneEdit', type: 'boolean', default: false },
  { key: 'profile.enableSetUserName', type: 'boolean', default: false },
  { key: 'fce.enablePreferHeader', type: 'boolean', default: false },
  { key: 'global.enableSkyra', type: 'boolean', default: false },
  { key: 'global.enableCookieBanner', type: 'boolean', default: false },
  { key: 'dialogDetails.enableNotificationLogs', type: 'boolean', default: false },
  { key: 'dialogDetails.enableLabelAssignmentLogs', type: 'boolean', default: false },
  { key: 'dialogDetails.enableActivityLogFilter', type: 'boolean', default: false },
  { key: 'dialogDetails.enableForwardByEmail', type: 'boolean', default: false },
] as const satisfies readonly FeatureFlagDefinition[];

export type FeatureFlagKey = (typeof featureFlagDefinitions)[number]['key'];
