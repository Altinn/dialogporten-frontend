import { ReactPlugin } from '@microsoft/applicationinsights-react-js';
import type { ITelemetryItem, ITelemetryPlugin } from '@microsoft/applicationinsights-web';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { config } from './config';

let applicationInsights: ApplicationInsights | null = null;

const applicationInsightsEnabled = config.applicationInsightsInstrumentationKey && import.meta.env.PROD;

if (applicationInsightsEnabled) {
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
        // Avoid tracking every ajax/fetch request
        disableAjaxTracking: true,
        disableFetchTracking: true,
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

    applicationInsights.addTelemetryInitializer((envelope: ITelemetryItem) => {
      // Only filter exceptions
      if (envelope.baseType === 'ExceptionData') {
        const data = envelope.baseData;
        const message = data?.message || '';
        const exceptions = data?.exceptions || [];

        const extensionUrlPattern = /^(chrome|moz|safari|edge|ms-browser)-extension:\/\//i;
        // Catch all browser extensions
        if (extensionUrlPattern.test(message)) {
          return false;
        }

        // Check all exception details for extension URLs
        for (const exception of exceptions) {
          if (exception.stack && extensionUrlPattern.test(exception.stack)) {
            return false;
          }

          // Check parsed stack frames
          if (exception.parsedStack && Array.isArray(exception.parsedStack)) {
            for (const frame of exception.parsedStack) {
              if (frame.fileName && extensionUrlPattern.test(frame.fileName)) {
                return false;
              }
            }
          }
        }

        // Filter cross-origin errors
        if (message === 'Script error.' || message === 'Script error') {
          return false;
        }
      }

      return true;
    });
  } catch (error) {
    console.error('Failed to initialize Application Insights:', error);
    applicationInsights = null;
  }
} else {
  console.warn('ApplicationInsightsInstrumentationKey is undefined. Tracking is disabled.');
}

const noop = () => {};

export const Analytics = {
  isEnabled: applicationInsightsEnabled,
  trackPageView: applicationInsights?.trackPageView.bind(applicationInsights) || noop,
  trackEvent: applicationInsights?.trackEvent.bind(applicationInsights) || noop,
  trackException: applicationInsights?.trackException.bind(applicationInsights) || noop,
  trackDependency: applicationInsights?.trackDependencyData.bind(applicationInsights) || noop,
};
