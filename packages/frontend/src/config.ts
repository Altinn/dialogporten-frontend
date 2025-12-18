interface Window {
  applicationInsightsInstrumentationKey: string | undefined;
  dialogportenStreamUrl: string;
}

declare const window: Window;

export const config = {
  applicationInsightsInstrumentationKey: import.meta.env.DEV 
    ? '12345678-1234-1234-1234-123456789012'
    : window.applicationInsightsInstrumentationKey,
  applicationInsightsEndpointUrl: import.meta.env.DEV
    ? 'http://localhost:3001/v2/track'
    : undefined,
  dialogportenStreamUrl: import.meta.env.DEV
    ? 'https://altinn-dev-api.azure-api.net/dialogporten/graphql/stream'
    : window.dialogportenStreamUrl,
};
