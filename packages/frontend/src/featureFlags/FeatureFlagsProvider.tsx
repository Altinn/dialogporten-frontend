import type React from 'react';
import { type ReactNode, createContext } from 'react';
import { Analytics } from '../analytics';
import { useAuthenticatedQuery } from '../auth/useAuthenticatedQuery.tsx';
import { featureFlagDefinitions, getFeatureFlag } from './FeatureFlags';

export type FeatureFlagValues = Record<string, boolean | number | string | undefined>;

export const FeatureFlagContext = createContext<FeatureFlagValues | undefined>(undefined);

interface FeatureFlagProviderProps {
  children: ReactNode;
  initialFlags?: Record<string, unknown>;
}

export async function loadFeatureFlags() {
  const res = await Analytics.trackFetchDependency('loadFeatureFlags', fetch('/api/features'));
  if (res.ok) {
    return res.json();
  }
}

export const FeatureFlagProvider: React.FC<FeatureFlagProviderProps> = ({ children, initialFlags }) => {
  const { data } = useAuthenticatedQuery<Record<string, unknown>>({
    queryKey: ['featureFlags'],
    queryFn: loadFeatureFlags,
    initialData: initialFlags,
    refetchInterval: 1_200_000, // 20 minutes
    staleTime: 10 * 60 * 1000,
    refetchOnMount: 'always',
  });

  const resolvedFlags: FeatureFlagValues = featureFlagDefinitions.reduce((acc, def) => {
    acc[def.key] = getFeatureFlag(def.key, data ?? {});
    return acc;
  }, {} as FeatureFlagValues);

  return <FeatureFlagContext.Provider value={resolvedFlags}>{children}</FeatureFlagContext.Provider>;
};
