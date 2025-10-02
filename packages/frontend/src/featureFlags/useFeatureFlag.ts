import { useContext } from 'react';
import { useErrorLogger } from '../hooks/useErrorLogger';
import type { FeatureFlagKeys } from './FeatureFlags';
import { FeatureFlagContext } from './FeatureFlagsProvider';

export function useFeatureFlag<T>(flag: FeatureFlagKeys): T {
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
    return undefined as T;
  }
  return context[flag] as T;
}
