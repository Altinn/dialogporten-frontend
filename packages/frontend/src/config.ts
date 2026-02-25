interface Window {
  applicationInsightsInstrumentationKey: string | undefined;
  applicationInsightsDisableDependencyTracking: string | undefined;
  dialogportenStreamUrl: string;
}

declare const window: Window;

export const config = {
  applicationInsightsInstrumentationKey: window.applicationInsightsInstrumentationKey,
  applicationInsightsDisableDependencyTracking:
    window.applicationInsightsDisableDependencyTracking?.toLowerCase() === 'true',
  dialogportenStreamUrl: import.meta.env.DEV
    ? 'https://platform.at23.altinn.cloud/dialogporten/graphql/stream'
    : window.dialogportenStreamUrl,
};
