interface Window {
  applicationInsightsInstrumentationKey: string | undefined;
  dialogportenStreamUrl: string;
}

declare const window: Window;

export const config = {
  applicationInsightsInstrumentationKey: window.applicationInsightsInstrumentationKey,
  dialogportenStreamUrl: import.meta.env.DEV
    ? 'https://platform.at23.altinn.cloud/dialogporten/graphql/stream'
    : window.dialogportenStreamUrl,
};
