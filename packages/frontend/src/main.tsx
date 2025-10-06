import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './i18n/config.ts';

import { RootProvider } from '@altinn/altinn-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import { AuthProvider } from './components/Login/AuthContext.tsx';
import { LoggerContextProvider } from './contexts/LoggerContext.tsx';
import { FeatureFlagProvider, loadFeatureFlags } from './featureFlags';
import { OnboardingTourProvider } from './onboardingTour';

declare const __APP_VERSION__: string;
console.info('App Version:', __APP_VERSION__);

async function enableMocking() {
  if (import.meta.env.DEV) {
    const urlParams = new URLSearchParams(window.location.search);
    const enableMocking = urlParams.get('mock') === 'true';
    if (enableMocking) {
      const { worker } = await import('./mocks/browser');
      return worker.start();
    }
  }
}

async function loadFeatures() {
  try {
    return await loadFeatureFlags();
  } catch (err) {
    console.error('Failed to load feature flags:', err);
    return {};
  }
}
const element = document.getElementById('root');

if (element) {
  const root = ReactDOM.createRoot(element);
  const queryClient = new QueryClient();
  Promise.all([enableMocking(), loadFeatures()]).then(([_, initialFlags]) => {
    root.render(
      <React.StrictMode>
        <LoggerContextProvider>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <FeatureFlagProvider initialFlags={initialFlags}>
                <AuthProvider>
                  <RootProvider>
                    <OnboardingTourProvider>
                      <App />
                    </OnboardingTourProvider>
                  </RootProvider>
                </AuthProvider>
              </FeatureFlagProvider>
            </BrowserRouter>
          </QueryClientProvider>
        </LoggerContextProvider>
      </React.StrictMode>,
    );
  });
} else {
  console.error(`element with id "root" is not in DOM`);
}
