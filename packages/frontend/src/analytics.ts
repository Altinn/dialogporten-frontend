import { ReactPlugin } from '@microsoft/applicationinsights-react-js';
import type { ITelemetryItem, ITelemetryPlugin } from '@microsoft/applicationinsights-web';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { config } from './config';

let applicationInsights: ApplicationInsights | null = null;

const applicationInsightsEnabled = config.applicationInsightsInstrumentationKey && import.meta.env.PROD;

// Enhanced page name mapping for better funnel analysis
const getPageNameFromPath = (pathname: string): string => {
  // Remove query parameters and fragments
  const cleanPath = pathname.split('?')[0].split('#')[0];

  // Map paths to meaningful page names
  const pageMapping: Record<string, string> = {
    '/': 'Inbox',
    '/sent': 'Sent Items',
    '/drafts': 'Drafts',
    '/archive': 'Archive',
    '/bin': 'Bin',
    '/saved-searches': 'Saved Searches',
    '/about': 'About',
    '/profile': 'Profile Overview',
    '/profile/parties': 'Parties Management',
    '/profile/notifications': 'Notification Settings',
    '/profile/settings': 'User Settings',
    '/profile/access': 'Access Management',
    '/profile/activities': 'Activity Log',
    '/profile/authorize': 'Authorization',
    '/error': 'Error Page',
    '/logout': 'Logout',
  };

  // Handle dynamic routes (like /inbox/:id)
  if (cleanPath.startsWith('/inbox/') && cleanPath !== '/inbox') {
    return 'Dialog Details';
  }

  // Return mapped name or fallback to cleaned path
  return pageMapping[cleanPath] || cleanPath.replace(/^\//, '').replace(/\//g, ' > ') || 'Unknown Page';
};

// Enhanced page view tracking function
export const trackPageView = (
  pageName?: string,
  url?: string,
  properties?: Record<string, string>,
  measurements?: Record<string, number>,
) => {
  if (!applicationInsights) return;

  const currentUrl = url || window.location.href;
  const currentPath = new URL(currentUrl).pathname;
  const enhancedPageName = pageName || getPageNameFromPath(currentPath);

  // Enhanced properties for better analysis
  const enhancedProperties = {
    'page.path': currentPath,
    'page.url': currentUrl,
    'page.referrer': document.referrer,
    'page.title': document.title,
    'user.agent': navigator.userAgent,
    'viewport.width': window.innerWidth,
    'viewport.height': window.innerHeight,
    ...properties,
  };

  applicationInsights.trackPageView({
    name: enhancedPageName,
    uri: currentUrl,
    properties: enhancedProperties,
    measurements,
  });

  console.info(`Page view tracked: ${enhancedPageName} (${currentPath})`);
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
        // Enhance page view telemetry with better names
        case 'PageviewData':
          {
            const pageViewData = envelope.baseData;
            if (pageViewData?.name && pageViewData.name === document.title) {
              // If the page name is just the document title, enhance it
              const betterName = getPageNameFromPath(window.location.pathname);
              pageViewData.name = betterName;

              // Add funnel-friendly properties
              envelope.data = envelope.data || {};
              envelope.data.properties = envelope.data.properties || {};
              envelope.data.properties['funnel.step'] = betterName;
              envelope.data.properties['funnel.category'] = getFunnelCategory(window.location.pathname);
            }
          }
          break;
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

    // Track initial page view with enhanced name
    trackPageView();
  } catch (error) {
    console.error('Failed to initialize Application Insights:', error);
    applicationInsights = null;
  }
} else {
  console.warn('ApplicationInsightsInstrumentationKey is undefined. Tracking is disabled.');
}

// Helper function to categorize pages for funnel analysis
const getFunnelCategory = (pathname: string): string => {
  if (pathname === '/') return 'Core';
  if (pathname.startsWith('/profile')) return 'Profile';
  if (['/sent', '/drafts', '/archive', '/bin'].includes(pathname)) return 'Mail Management';
  if (pathname.startsWith('/inbox/')) return 'Dialog Interaction';
  if (pathname === '/saved-searches') return 'Search';
  return 'Other';
};

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
  trackEvent: applicationInsights?.trackEvent.bind(applicationInsights) || noop,
  trackException: applicationInsights?.trackException.bind(applicationInsights) || noop,
  trackDependency: applicationInsights?.trackDependencyData.bind(applicationInsights) || noop,
  trackFetchDependency: trackFetchDependency,
};
