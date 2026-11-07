import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockLoadAppInsights = vi.fn();
const mockUnload = vi.fn();
const mockTrackException = vi.fn();
const mockOnunloadFlush = vi.fn();
const mockConstructor = vi.fn();
const mockAddTelemetryInitializer = vi.fn();

vi.mock('@microsoft/applicationinsights-web', () => ({
  ApplicationInsights: class {
    constructor(...args: unknown[]) {
      mockConstructor(...args);
    }
    addTelemetryInitializer = (...args: unknown[]) => mockAddTelemetryInitializer(...args);
    loadAppInsights = () => mockLoadAppInsights();
    unload = (...args: unknown[]) => mockUnload(...args);
    trackException = (...args: unknown[]) => mockTrackException(...args);
    onunloadFlush = (...args: unknown[]) => mockOnunloadFlush(...args);
  },
}));

vi.mock('@microsoft/applicationinsights-react-js', () => ({
  ReactPlugin: class {},
}));

vi.mock('../config.ts', () => ({
  config: { applicationInsightsInstrumentationKey: 'instrumentation-key' },
}));

const importAnalytics = async () => {
  vi.resetModules();
  return import('./analytics.ts');
};

const setCookie = (cookie: string) => {
  // biome-ignore lint/suspicious/noDocumentCookie: jsdom does not implement the Cookie Store API
  document.cookie = cookie;
};

describe('setAnalyticsEnabled', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('PROD', true);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('does not load Application Insights before analytics is enabled', async () => {
    const { Analytics } = await importAnalytics();

    Analytics.trackException({ exception: new Error('test') });

    expect(Analytics.isEnabled).toBe(false);
    expect(mockLoadAppInsights).not.toHaveBeenCalled();
    expect(mockTrackException).not.toHaveBeenCalled();
  });

  it('loads Application Insights once when enabled', async () => {
    const { Analytics, setAnalyticsEnabled } = await importAnalytics();

    setAnalyticsEnabled(true);
    setAnalyticsEnabled(true);
    Analytics.trackException({ exception: new Error('test') });

    expect(Analytics.isEnabled).toBe(true);
    expect(mockLoadAppInsights).toHaveBeenCalledTimes(1);
    expect(mockTrackException).toHaveBeenCalledTimes(1);
  });

  it('unloads Application Insights and removes its cookies and storage when disabled', async () => {
    const { Analytics, setAnalyticsEnabled } = await importAnalytics();
    setAnalyticsEnabled(true);
    setCookie('ai_user=user; Path=/');
    setCookie('ai_session=session; Path=/');
    localStorage.setItem('ai_session', 'session');

    setAnalyticsEnabled(false);
    Analytics.trackException({ exception: new Error('test') });

    expect(Analytics.isEnabled).toBe(false);
    expect(mockUnload).toHaveBeenCalledTimes(1);
    expect(mockTrackException).not.toHaveBeenCalled();
    expect(document.cookie).not.toMatch(/ai_(user|session)=/);
    expect(localStorage.getItem('ai_session')).toBeNull();
  });

  it('removes cookies left from earlier visits when analytics was never enabled', async () => {
    setCookie('ai_user=user; Path=/');
    const { setAnalyticsEnabled } = await importAnalytics();

    setAnalyticsEnabled(false);

    expect(mockUnload).not.toHaveBeenCalled();
    expect(document.cookie).not.toMatch(/ai_user=/);
  });

  it('never loads Application Insights outside production builds', async () => {
    vi.stubEnv('PROD', false);
    const { setAnalyticsEnabled } = await importAnalytics();

    setAnalyticsEnabled(true);

    expect(mockLoadAppInsights).not.toHaveBeenCalled();
  });
});

describe('Analytics.flush', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('PROD', true);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('sends pending telemetry with the unload sender', async () => {
    const { Analytics, setAnalyticsEnabled } = await importAnalytics();
    setAnalyticsEnabled(true);

    Analytics.flush();

    expect(mockOnunloadFlush).toHaveBeenCalledWith(false);
  });

  it('does nothing before analytics is enabled', async () => {
    const { Analytics } = await importAnalytics();

    expect(() => Analytics.flush()).not.toThrow();
    expect(mockOnunloadFlush).not.toHaveBeenCalled();
  });

  it('makes the unload sender use sendBeacon instead of fetch keepalive', async () => {
    const { setAnalyticsEnabled } = await importAnalytics();

    setAnalyticsEnabled(true);

    expect(mockConstructor).toHaveBeenCalledWith({
      config: expect.objectContaining({ onunloadDisableFetch: true }),
    });
  });
});

describe('exception telemetry filter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('PROD', true);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const getInitializer = async () => {
    const { setAnalyticsEnabled } = await importAnalytics();
    setAnalyticsEnabled(true);
    return mockAddTelemetryInitializer.mock.calls[0][0] as (envelope: unknown) => boolean;
  };

  const stackOverflow = (fileNames: string[]) => ({
    baseType: 'ExceptionData',
    baseData: {
      exceptions: [
        {
          typeName: 'RangeError',
          message: 'Maximum call stack size exceeded.',
          parsedStack: fileNames.map((fileName, level) => ({ level, fileName })),
        },
      ],
    },
  });

  it.each([
    ['the production bundle', [`${window.location.origin}/assets/index.1.185.2.js`]],
    ['dev server modules', [`${window.location.origin}/src/pages/Inbox/Inbox.tsx?t=1`]],
    [
      'our bundle further down the stack',
      ['', `${window.location.origin}/inbox`, `${window.location.origin}/assets/usePageTitle.1.185.2.js`],
    ],
  ])('keeps errors with a frame in %s', async (_, fileNames) => {
    const initializer = await getInitializer();

    expect(initializer(stackOverflow(fileNames))).toBe(true);
  });

  it.each([
    ['the page URL', [`${window.location.origin}/inbox?view=all`, `${window.location.origin}/inbox`]],
    ['a script on another host', ['https://www.gstatic.com/injected.js']],
    ['user scripts and native code', ['code@user-script:5', '']],
  ])('drops errors whose frames only point at %s', async (_, fileNames) => {
    const initializer = await getInitializer();

    expect(initializer(stackOverflow(fileNames))).toBe(false);
  });

  it('keeps errors without a parsed stack', async () => {
    const initializer = await getInitializer();

    expect(initializer(stackOverflow([]))).toBe(true);
  });
});

describe('application version tag', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('PROD', true);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  const tagsFor = async (baseType: string) => {
    const { setAnalyticsEnabled } = await importAnalytics();
    setAnalyticsEnabled(true);
    const initializer = mockAddTelemetryInitializer.mock.calls[0][0] as (envelope: unknown) => boolean;
    const envelope: { baseType: string; baseData: object; tags?: Record<string, string> } = { baseType, baseData: {} };
    initializer(envelope);
    return envelope.tags;
  };

  it.each(['PageviewData', 'EventData', 'ExceptionData'])('tags %s with the build version', async (baseType) => {
    vi.stubGlobal('__APP_VERSION__', '1.185.2');

    expect(await tagsFor(baseType)).toMatchObject({ 'ai.application.ver': '1.185.2' });
  });

  it.each([
    ['empty', ''],
    ['undefined', undefined],
  ])('leaves the version out when it is %s', async (_, version) => {
    vi.stubGlobal('__APP_VERSION__', version);

    expect(await tagsFor('PageviewData')).not.toHaveProperty(['ai.application.ver']);
  });

  it('leaves the version out when it is not defined at all', async () => {
    expect(await tagsFor('PageviewData')).not.toHaveProperty(['ai.application.ver']);
  });
});
