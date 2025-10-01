import { useContext } from 'react';
import type { FeatureFlagKey } from './FeatureFlags.ts';
import { FeatureFlagContext } from './FeatureFlagsProvider';

export function useFeatureFlag<T = boolean | number | string>(flag: FeatureFlagKey, fallback?: T): T {
  const context = useContext(FeatureFlagContext);

  if (context === undefined) {
    return fallback as T;
  }

  return (context[flag] as T) ?? (fallback as T);
}
