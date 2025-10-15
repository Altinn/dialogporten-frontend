import { useQuery } from '@tanstack/react-query';
import type React from 'react';
import { type ReactNode, createContext } from 'react';
import { featureFlagDefinitions, getFeatureFlag } from './FeatureFlags';
import { Analytics } from '../analytics';

export type FeatureFlagValues = Record<string, boolean | number | string | undefined>;

export const FeatureFlagContext = createContext<FeatureFlagValues | undefined>(undefined);

interface FeatureFlagProviderProps {
  children: ReactNode;
  initialFlags?: Record<string, unknown>;
}

export async function loadFeatureFlags() {
  const res = await Analytics.trackFetchDependency('loadFeatureFlags', fetch('/api/features'));
  if (!res.ok) throw new Error('Failed to load feature flags');
  return res.json();
}

export const FeatureFlagProvider: React.FC<FeatureFlagProviderProps> = ({ children, initialFlags }) => {
  const { data } = useQuery<Record<string, unknown>>({
    queryKey: ['featureFlags'],
    queryFn: loadFeatureFlags,
    initialData: initialFlags,
    refetchInterval: 1_200_000, // 20 minutes
    staleTime: 10 * 60 * 1000,
    refetchOnMount: initialFlags ? false : 'always',
  });

  const resolvedFlags: FeatureFlagValues = featureFlagDefinitions.reduce((acc, def) => {
    acc[def.key] = getFeatureFlag(def.key, data ?? {});
    return acc;
  }, {} as FeatureFlagValues);

  return <FeatureFlagContext.Provider value={resolvedFlags}>{children}</FeatureFlagContext.Provider>;
};
