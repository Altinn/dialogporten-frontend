import { ReactPlugin } from '@microsoft/applicationinsights-react-js';
import type { ITelemetryPlugin } from '@microsoft/applicationinsights-web';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { config } from './config';

let applicationInsights: ApplicationInsights | null = null;

if (config.applicationInsightsInstrumentationKey && import.meta.env.PROD) {
  const reactPlugin = new ReactPlugin();
  try {
    applicationInsights = new ApplicationInsights({
      config: {
        instrumentationKey: config.applicationInsightsInstrumentationKey,
        extensions: [reactPlugin as unknown as ITelemetryPlugin],
        enableAutoRouteTracking: true,
        autoTrackPageVisitTime: true,
        enableCorsCorrelation: true,
        enableUnhandledPromiseRejectionTracking: true,
        enableAjaxErrorStatusText: true,
        enableRequestHeaderTracking: true,
        enableResponseHeaderTracking: true,
        enableAjaxPerfTracking: true,
        enablePerfMgr: true,
        disableCookiesUsage: false,
        // TODO: set to a lower value in production
        samplingPercentage: 100,
        appId: 'arbeidsflate-frontend',
        enableDebug: false,
      },
    });
    applicationInsights.loadAppInsights();
    console.info('Application Insights initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Application Insights:', error);
    applicationInsights = null;
  }
} else {
  console.warn('ApplicationInsightsInstrumentationKey is undefined. Tracking is disabled.');
}

const noop = () => {};

export const Analytics = {
  trackPageView: applicationInsights?.trackPageView.bind(applicationInsights) || noop,
  trackEvent: applicationInsights?.trackEvent.bind(applicationInsights) || noop,
  trackException: applicationInsights?.trackException.bind(applicationInsights) || noop,
};
