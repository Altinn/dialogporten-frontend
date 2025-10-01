import { useQuery } from '@tanstack/react-query';
import type React from 'react';
import { type ReactNode, createContext } from 'react';
import { featureFlagDefinitions, getFeatureFlag } from './FeatureFlags';

export type FeatureFlagValues = Record<string, boolean | number | string | undefined>;

export const FeatureFlagContext = createContext<FeatureFlagValues | undefined>(undefined);

interface FeatureFlagProviderProps {
  children: ReactNode;
}

export const FeatureFlagProvider: React.FC<FeatureFlagProviderProps> = ({ children }) => {
  const { data } = useQuery<Record<string, unknown>>({
    queryKey: ['featureFlags'],
    queryFn: async () => {
      const res = await fetch('/api/features');
      if (!res.ok) throw new Error('Failed to load feature flags');
      return res.json();
    },
  });

  const resolvedFlags: FeatureFlagValues = featureFlagDefinitions.reduce((acc, def) => {
    acc[def.key] = getFeatureFlag(def.key, data ?? {});
    return acc;
  }, {} as FeatureFlagValues);

  return <FeatureFlagContext.Provider value={resolvedFlags}>{children}</FeatureFlagContext.Provider>;
};
