export const getSubscriptionQuery = (dialogId: string): string => `
  subscription sub {
    dialogEvents(dialogId: "${dialogId}") {
      id
      type
    }
  }
`;
