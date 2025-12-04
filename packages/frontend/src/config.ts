interface Window {
  applicationInsightsInstrumentationKey: string | undefined;
  dialogportenStreamUrl: string;
}

declare const window: Window;

export const config = {
  applicationInsightsInstrumentationKey: window.applicationInsightsInstrumentationKey,
  dialogportenStreamUrl: import.meta.env.DEV
    ? 'https://altinn-dev-api.azure-api.net/dialogporten/graphql/stream'
    : window.dialogportenStreamUrl,
};
