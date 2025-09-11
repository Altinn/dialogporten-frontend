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
        enableRequestHeaderTracking: false,
        enableResponseHeaderTracking: false,
        enableAjaxPerfTracking: false,
        enablePerfMgr: true,
        disableCookiesUsage: false,
        // TODO: set to a lower value in production
        samplingPercentage: 100,
        appId: 'arbeidsflate-frontend',
        enableDebug: true,
      },
    });
    applicationInsights.loadAppInsights();
    console.info('Application Insights initialized successfully');

    applicationInsights.addTelemetryInitializer((envelope: ITelemetryItem) => {
      // Only filter exceptions
      switch (envelope.baseType) {
        case 'RemoteDependencyData': {
          const dependencyData = envelope.baseData;
          const backendTraceId = dependencyData?.properties?.['backend.traceId'];

          if (backendTraceId) {
            // This only affects THIS specific telemetry item
            envelope.tags = envelope.tags || {};
            envelope.tags['ai.operation.id'] = backendTraceId;
            envelope.tags['ai.operation.parentId'] = `|${backendTraceId}.${Date.now()}`;
          }
          break;
        }

        case 'ExceptionData': {
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
          break;
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

// Enhanced helper function to track fetch requests with same operation ID
export const trackFetchDependency = async (
  name: string,
  fetchPromise: Promise<Response>,
  startTime: number = Date.now(),
): Promise<Response> => {
  if (!applicationInsightsEnabled) {
    return fetchPromise;
  }

  let success = true;
  let responseStatus = 200;
  let response: Response | undefined;
  let targetUrl = 'unknown';
  let backendTraceId = `${name}-${startTime}`;

  try {
    response = await fetchPromise;
    responseStatus = response.status;
    success = response.ok;
    targetUrl = response.url ? new URL(response.url).origin : 'unknown';

    // Extract correlation headers from response
    backendTraceId = response.headers.get('X-Trace-Id') || backendTraceId;

    return response;
  } catch (error) {
    success = false;
    const err = error as Error;
    responseStatus =
      err.message?.toLowerCase().includes('network') || err.message?.toLowerCase().includes('fetch') ? 500 : 400;
    throw error;
  } finally {
    const duration = Date.now() - startTime;
    Analytics.trackDependency({
      id: backendTraceId,
      target: targetUrl,
      name: name,
      duration: duration,
      success: success,
      responseCode: responseStatus,
      properties: {
        'backend.traceId': backendTraceId,
        'correlation.source': 'backend-response',
        'request.type': name.includes('GraphQL') ? 'graphql' : 'http',
      },
      type: 'HTTP',
    });
  }
};

export const Analytics = {
  isEnabled: applicationInsightsEnabled,
  trackPageView: applicationInsights?.trackPageView.bind(applicationInsights) || noop,
  trackEvent: applicationInsights?.trackEvent.bind(applicationInsights) || noop,
  trackException: applicationInsights?.trackException.bind(applicationInsights) || noop,
  trackDependency: applicationInsights?.trackDependencyData.bind(applicationInsights) || noop,
  trackFetchDependency: trackFetchDependency,
};
