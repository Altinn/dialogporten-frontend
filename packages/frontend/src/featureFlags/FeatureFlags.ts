export type FeatureFlagType = 'boolean' | 'number' | 'string' | 'string-array';

export interface FeatureFlagDefinition {
  key: string; // dot-notation key
  type: FeatureFlagType; // type of value
  default: boolean | number | string | string[]; // fallback value
}

export const featureFlagDefinitions = [
  { key: 'dialogporten.disableFlipNamesPatch', type: 'boolean', default: false },
  { key: 'inbox.enableAltinn2Messages', type: 'boolean', default: false },
  { key: 'inbox.enableAlertBanner', type: 'boolean', default: false },
  { key: 'dialogporten.disableSubscriptions', type: 'boolean', default: false },
  { key: 'inbox.accountNavigatorEnabled', type: 'boolean', default: false },
  { key: 'auth.orgsNotReadyToDealWithDelegations', type: 'string-array', default: [] },
  { key: 'inbox.banner.escalateWarning', type: 'boolean', default: false },
  { key: 'inbox.disableBetaLabel', type: 'boolean', default: false },
  { key: 'SI.emailAccount.enableConnectLink', type: 'boolean', default: false },
  { key: 'profil.enableSIPhoneEdit', type: 'boolean', default: false },
  { key: 'inbox.hideAltinn2Links', type: 'boolean', default: false },
] as const satisfies readonly FeatureFlagDefinition[];

export type FeatureFlagKey = (typeof featureFlagDefinitions)[number]['key'];

export function getFeatureFlag(
  key: string,
  overrides: Record<string, unknown> = {},
): boolean | number | string | string[] | undefined {
  const def = featureFlagDefinitions.find((f) => f.key === key);
  if (!def) return undefined;

  const value = overrides[key];
  if (value === undefined) return def.default;

  const type = def.type as FeatureFlagType;

  try {
    switch (type) {
      case 'boolean':
        return typeof value === 'boolean' ? value : String(value).toLowerCase() === 'true';

      case 'number': {
        const n = Number(value);
        return Number.isNaN(n) ? def.default : n;
      }

      case 'string':
        return String(value);

      case 'string-array':
        if (Array.isArray(value)) return value.map(String);
        if (typeof value === 'string') return value.split(',').map((s) => s.trim());
        return def.default;

      default:
        return def.default;
    }
  } catch {
    return def.default;
  }
}
