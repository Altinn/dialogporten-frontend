import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './i18n/config.ts';
import { RootProvider as AltinnRootProvider, type LanguageCode } from '@altinn/altinn-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import App from './App.tsx';
import { AuthProvider } from './components/Login/AuthContext.tsx';
import { LoggerContextProvider } from './contexts/LoggerContext.tsx';
import { FeatureFlagProvider, loadFeatureFlags } from './featureFlags';
import { OnboardingTourProvider } from './onboardingTour';

declare const __APP_VERSION__: string;
console.info('App Version:', __APP_VERSION__);

const urlParams = new URLSearchParams(window.location.search);
const isEnableMocking = urlParams.get('mock') === 'true';

async function enableMocking() {
  if (import.meta.env.DEV) {
    if (isEnableMocking) {
      const { worker } = await import('./mocks/browser');
      return worker.start();
    }
  }
}

async function loadFeatures() {
  try {
    if (window.location.pathname === '/logout') {
      return {
        'party.stopReversingPersonNameOrder': false,
      };
    }
    return await loadFeatureFlags();
  } catch (error) {
    return {};
  }
}
const element = document.getElementById('root');

const RootProvider = ({ children }: { children: React.ReactNode }) => {
  const { i18n } = useTranslation();
  const languageCode = i18n.language as LanguageCode;

  return <AltinnRootProvider languageCode={languageCode}>{children}</AltinnRootProvider>;
};

if (element) {
  const root = ReactDOM.createRoot(element);
  const queryClient = new QueryClient();
  Promise.all([enableMocking(), loadFeatures()]).then(([_, initialFlags]) => {
    root.render(
      <React.StrictMode>
        <LoggerContextProvider>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <FeatureFlagProvider initialFlags={isEnableMocking ? undefined : initialFlags}>
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
