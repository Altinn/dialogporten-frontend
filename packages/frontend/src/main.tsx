import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './i18n/config.ts';

import { RootProvider } from '@altinn/altinn-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import { AuthProvider } from './components/Login/AuthContext.tsx';
import { LoggerContextProvider } from './contexts/LoggerContext.tsx';
import { FeatureFlagProvider, featureFlags } from './featureFlags';

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

const element = document.getElementById('root');
if (element) {
  const root = ReactDOM.createRoot(element);
  const queryClient = new QueryClient();
  enableMocking().then(() => {
    root.render(
      <React.StrictMode>
        <LoggerContextProvider>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <FeatureFlagProvider flags={featureFlags}>
                <AuthProvider>
                  <RootProvider>
                    <App />
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
