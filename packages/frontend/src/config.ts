interface Window {
  applicationInsightsInstrumentationKey: string | undefined;
  applicationInsightsDisableDependencyTracking: string | undefined;
  dialogportenStreamUrl: string;
}

declare const window: Window;

const isTrue = (value: string | undefined): boolean => value?.toLowerCase() === 'true';

export const config = {
  applicationInsightsInstrumentationKey: window.applicationInsightsInstrumentationKey,
  applicationInsightsDisableDependencyTracking: isTrue(window.applicationInsightsDisableDependencyTracking),
  dialogportenStreamUrl: import.meta.env.DEV
    ? 'https://platform.at23.altinn.cloud/dialogporten/graphql/stream'
    : window.dialogportenStreamUrl,
};
