export const getGqlStreamEndpoint = () => {
  if (import.meta.env.DEV) {
    return 'https://altinn-dev-api.azure-api.net/dialogporten/graphql/stream';
  }
  return (window as unknown as { dialogportenStreamUrl: string }).dialogportenStreamUrl;
};

export const getSubscriptionQuery = (dialogId: string): string => `
  subscription sub {
    dialogEvents(dialogId: "${dialogId}") {
      id
      type
    }
  }
`;
