interface Window {
  applicationInsightsInstrumentationKey: string | undefined;
  dialogportenStreamUrl: string | undefined;
}

declare const window: Window;

export const config = {
  applicationInsightsInstrumentationKey: window.applicationInsightsInstrumentationKey,
  dialogportenStreamUrl:
    window.dialogportenStreamUrl || 'https://altinn-dev-api.azure-api.net/dialogporten/graphql/stream',
};
