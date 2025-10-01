import { useContext } from 'react';
import { useErrorLogger } from '../hooks/useErrorLogger';
import type { FeatureFlagKey } from './FeatureFlags.ts';
import { FeatureFlagContext } from './FeatureFlagsProvider';

export function useFeatureFlag<T = boolean | number | string>(flag: FeatureFlagKey, fallback?: T): T {
  const context = useContext(FeatureFlagContext);
  const { logError } = useErrorLogger();

  if (context === undefined) {
    logError(
      new Error('useFeatureFlag must be used within a FeatureFlagProvider'),
      {
        context: 'useFeatureFlag',
        flag,
      },
      'useFeatureFlag must be used within a FeatureFlagProvider',
    );
    return fallback as T;
  }

  return (context[flag] as T) ?? (fallback as T);
}
