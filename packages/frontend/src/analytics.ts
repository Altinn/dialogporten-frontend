import { ReactPlugin } from '@microsoft/applicationinsights-react-js';
import type { ITelemetryItem, ITelemetryPlugin } from '@microsoft/applicationinsights-web';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { config } from './config';
import { PageRoutes } from './pages/routes';
import type { AnalyticsEventName } from './analyticsEvents';

let applicationInsights: ApplicationInsights | null = null;

const applicationInsightsEnabled = config.applicationInsightsInstrumentationKey && import.meta.env.PROD;

const getPageNameFromPath = (pathname: string): string => {
  const cleanPath = pathname.split('?')[0].split('#')[0];

  const pageMapping: Record<string, string> = {
    [PageRoutes.inbox]: 'Inbox',
    [PageRoutes.sent]: 'Sent Items',
    [PageRoutes.drafts]: 'Drafts',
    [PageRoutes.archive]: 'Archive',
    [PageRoutes.bin]: 'Bin',
    [PageRoutes.savedSearches]: 'Saved Searches',
    [PageRoutes.about]: 'About',
    [PageRoutes.profile]: 'Profile Overview',
    [PageRoutes.partiesOverview]: 'Parties Management',
    [PageRoutes.notifications]: 'Notification Settings',
    [PageRoutes.settings]: 'User Settings',
    [PageRoutes.access]: 'Access Management',
    [PageRoutes.activities]: 'Activity Log',
    [PageRoutes.authorize]: 'Authorization',
    [PageRoutes.error]: 'Error Page',
  };

  const dynamicRoutePatterns = [
    {
      pattern: /^\/inbox\/[^/]+\/?$/,
      pageName: 'Dialog Details',
    },
    // Add more dynamic route patterns here as needed
    // {
    //   pattern: /^\/profile\/[^/]+\/?$/,
    //   pageName: 'Profile Item'
    // },
  ];

  if (pageMapping[cleanPath]) {
    return pageMapping[cleanPath];
  }

  for (const { pattern, pageName } of dynamicRoutePatterns) {
    if (pattern.test(cleanPath)) {
      return pageName;
    }
  }

  return cleanPath.replace(/^\//, '').replace(/\//g, ' > ') || 'Unknown Page';
};

export const trackPageView = (pageInfo: {
  pathname: string;
  search: string;
  hash: string;
  state: string;
  url: string;
}) => {
  if (!applicationInsights) return;

  const currentUrl = pageInfo.url;
  const currentPath = pageInfo.pathname;
  const enhancedPageName = getPageNameFromPath(currentPath);

  const enhancedProperties = {
    'page.path': currentPath,
    'page.url': currentUrl,
    'page.referrer': document.referrer,
    'page.title': document.title,
    'user.agent': navigator.userAgent,
    'route.pathname': pageInfo.pathname,
    'route.search': pageInfo.search,
    'route.hash': pageInfo.hash,
    'route.state': pageInfo.state ? JSON.stringify(pageInfo.state) : '',
    'viewport.width': window.innerWidth,
    'viewport.height': window.innerHeight,
  };

  applicationInsights.trackPageView({
    name: enhancedPageName,
    uri: currentUrl,
    properties: enhancedProperties,
  });
};

export const trackUserAction = (action: string, properties?: Record<string, string>) => {
  if (!applicationInsights) return;

  applicationInsights.trackEvent({
    name: `User.${action}`,
    properties: {
      'page.current': getPageNameFromPath(window.location.pathname),
      timestamp: new Date().toISOString(),
      ...properties,
    },
  });
};

export const trackDialogAction = (action: string, dialogId?: string, properties?: Record<string, string>) => {
  trackUserAction(`Dialog.${action}`, {
    'dialog.id': dialogId || '',
    'dialog.action': action,
    ...properties,
  });
};

/**
 * Track custom events with Application Insights
 * @param eventName - The name of the event to track (use ANALYTICS_EVENTS constants)
 * @param properties - Additional properties to include with the event
 */
export const trackEvent = (eventName: AnalyticsEventName, properties?: Record<string, string | number | boolean>) => {
  if (!applicationInsights) return;

  const enhancedProperties = {
    'page.current': getPageNameFromPath(window.location.pathname),
    'page.url': window.location.href,
    timestamp: new Date().toISOString(),
    'user.agent': navigator.userAgent,
    'viewport.width': window.innerWidth,
    'viewport.height': window.innerHeight,
    ...properties,
  };

  applicationInsights.trackEvent({
    name: eventName,
    properties: enhancedProperties,
  });
};

if (applicationInsightsEnabled) {
  const reactPlugin = new ReactPlugin();
  try {
    applicationInsights = new ApplicationInsights({
      config: {
        instrumentationKey: config.applicationInsightsInstrumentationKey,
        extensions: [reactPlugin as unknown as ITelemetryPlugin],
        enableAutoRouteTracking: false, // Disable auto tracking, we'll handle it manually
        autoTrackPageVisitTime: true,
        enableCorsCorrelation: true,
        enableUnhandledPromiseRejectionTracking: true,
        enableAjaxErrorStatusText: true,
        disableAjaxTracking: true,
        disableFetchTracking: true,
        enableRequestHeaderTracking: false,
        enableResponseHeaderTracking: false,
        enableAjaxPerfTracking: false,
        enablePerfMgr: true,
        disableCookiesUsage: false,
        samplingPercentage: 100,
        appId: 'arbeidsflate-frontend',
        enableDebug: true,
      },
    });
    applicationInsights.loadAppInsights();
    console.info('Application Insights initialized successfully');

    applicationInsights.addTelemetryInitializer((envelope: ITelemetryItem) => {
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
        // Only filter exceptions
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
  trackPageView: trackPageView,
  trackUserAction: trackUserAction,
  trackDialogAction: trackDialogAction,
  trackEvent: trackEvent,
  trackEventRaw: applicationInsights?.trackEvent.bind(applicationInsights) || noop,
  trackException: applicationInsights?.trackException.bind(applicationInsights) || noop,
  trackDependency: applicationInsights?.trackDependencyData.bind(applicationInsights) || noop,
  trackFetchDependency: trackFetchDependency,
};
