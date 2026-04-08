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
    ? 'https://discore-at22-s79uoo-apim.azure-api.net/dialogporten/graphql/stream'
    : window.dialogportenStreamUrl,
};
