import { ReactPlugin } from '@microsoft/applicationinsights-react-js';
import type { ITelemetryItem, ITelemetryPlugin } from '@microsoft/applicationinsights-web';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { config } from './config';
import { PageRoutes } from './pages/routes';

let applicationInsights: ApplicationInsights | null = null;

const applicationInsightsEnabled = config.applicationInsightsInstrumentationKey || import.meta.env.DEV;

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

/**
 * Check if the given pathname is a valid trackable page
 */
const isValidTrackablePage = (pathname: string): boolean => {
  const cleanPath = pathname.split('?')[0].split('#')[0];

  // Check static routes
  if (pageMapping[cleanPath]) {
    return true;
  }

  // Check dynamic routes
  for (const { pattern } of dynamicRoutePatterns) {
    if (pattern.test(cleanPath)) {
      return true;
    }
  }

  return false;
};

const getPageNameFromPath = (pathname: string): string => {
  const cleanPath = pathname.split('?')[0].split('#')[0];

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

export const startPageTracking = (pageInfo: {
  pathname: string;
  search: string;
  hash: string;
  state: string;
  url: string;
}) => {
  if (!applicationInsights) return;

  const currentPath = pageInfo.pathname;

  const enhancedPageName = getPageNameFromPath(currentPath);

  try {
    applicationInsights.startTrackPage(enhancedPageName);
  } catch (error) {
    console.error('Failed to start page tracking:', error, { pageInfo });
  }
};

export const stopPageTracking = (pageInfo: {
  pathname: string;
  search: string;
  hash: string;
  state: string;
  url: string;
}) => {
  if (!applicationInsights) return;

  const currentPath = pageInfo.pathname;

  const currentUrl = pageInfo.url;
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
    'viewport.width': String(window.innerWidth),
    'viewport.height': String(window.innerHeight),
  };

  try {
    applicationInsights.stopTrackPage(enhancedPageName, currentUrl, enhancedProperties);
  } catch (error) {
    console.error('Failed to stop page tracking:', error, { pageInfo });
  }
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

if (applicationInsightsEnabled) {
  const reactPlugin = new ReactPlugin();
  try {
    applicationInsights = new ApplicationInsights({
      config: {
        instrumentationKey: config.applicationInsightsInstrumentationKey,
        endpointUrl: config.applicationInsightsEndpointUrl,
        extensions: [reactPlugin as unknown as ITelemetryPlugin],
        enableAutoRouteTracking: false, // Disable auto tracking, we'll handle it manually
        autoTrackPageVisitTime: false,
        enableCorsCorrelation: true,
        enableUnhandledPromiseRejectionTracking: false,
        enableAjaxErrorStatusText: true,
        disableAjaxTracking: true,
        disableFetchTracking: true,
        enableRequestHeaderTracking: false,
        enableResponseHeaderTracking: false,
        enableAjaxPerfTracking: false,
        enablePerfMgr: false,
        disableCookiesUsage: false,
        // To avoid issue where AI tries to calculate duration of page view, and throws an error
        overridePageViewDuration: false,
        samplingPercentage: 100,
        appId: 'arbeidsflate-frontend',
        enableDebug: true,
        maxAjaxCallsPerView: 2000,
      },
    });

    applicationInsights.addTelemetryInitializer((envelope: ITelemetryItem) => {
      envelope.tags = envelope.tags || {};
      envelope.tags['ai.cloud.role'] = 'frontend';
      envelope.tags['ai.cloud.roleInstance'] = 'frontend';

      switch (envelope.baseType) {
        case 'RemoteDependencyData': {
          const dependencyData = envelope.baseData;
          const backendTraceId = dependencyData?.properties?.['backend.traceId'];

          if (backendTraceId) {
            // This only affects THIS specific telemetry item
            envelope.tags['ai.operation.id'] = backendTraceId;
            envelope.tags['ai.operation.parentId'] = `|${backendTraceId}.${Date.now()}`;
          }
          break;
        }
        // Only filter exceptions

        case 'ExceptionData': {
          const baseData = envelope.baseData;
          const baseDataMessage = baseData?.message || '';
          const propertyMessage = baseData?.properties?.message || '';
          const exceptions = baseData?.exceptions || [];

          const extensionUrlPattern = /^(chrome|moz|safari|edge|ms-browser)-extension:\/\//i;
          // Catch all browser extensions
          if (extensionUrlPattern.test(propertyMessage) || extensionUrlPattern.test(baseDataMessage)) {
            return false;
          }

          // Check all exception details for extension URLs
          for (const exception of exceptions) {
            // Check parsed stack frames
            if (exception.parsedStack && Array.isArray(exception.parsedStack)) {
              for (const frame of exception.parsedStack) {
                if (frame.fileName && extensionUrlPattern.test(frame.fileName)) {
                  return false;
                }
              }
            }
          }

          const ignoreMessages = [
            'Script Error.',
            'Script Error',
            'ErrorEvent: Script error.',
            'EventSource connection error',
          ];
          if (ignoreMessages.some((text) => propertyMessage === text)) {
            return false;
          }
          break;
        }
      }

      return true;
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

// Mock functions for when analytics is disabled
const mockStartPageTracking = (_pageInfo: {
  pathname: string;
  search: string;
  hash: string;
  state: string;
  url: string;
}) => {};

const mockStopPageTracking = (_pageInfo: {
  pathname: string;
  search: string;
  hash: string;
  state: string;
  url: string;
}) => {};

const mockTrackUserAction = (_action: string, _properties?: Record<string, string>) => {};

const mockTrackDialogAction = (_action: string, _dialogId?: string, _properties?: Record<string, string>) => {};

const mockTrackFetchDependency = async (
  _name: string,
  fetchPromise: Promise<Response>,
  _startTime: number = Date.now(),
): Promise<Response> => {
  return fetchPromise;
};

const mockIsValidTrackablePage = (_pathname: string): boolean => false;

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
  startPageTracking: applicationInsightsEnabled ? startPageTracking : mockStartPageTracking,
  stopPageTracking: applicationInsightsEnabled ? stopPageTracking : mockStopPageTracking,
  trackUserAction: applicationInsightsEnabled ? trackUserAction : mockTrackUserAction,
  trackDialogAction: applicationInsightsEnabled ? trackDialogAction : mockTrackDialogAction,
  trackEvent: applicationInsights?.trackEvent.bind(applicationInsights) || noop,
  trackException: applicationInsights?.trackException.bind(applicationInsights) || noop,
  trackDependency: applicationInsights?.trackDependencyData.bind(applicationInsights) || noop,
  trackFetchDependency: applicationInsightsEnabled ? trackFetchDependency : mockTrackFetchDependency,
  isValidTrackablePage: applicationInsightsEnabled ? isValidTrackablePage : mockIsValidTrackablePage,
};
