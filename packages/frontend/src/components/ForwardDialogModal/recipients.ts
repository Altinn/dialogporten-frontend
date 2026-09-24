import { isValidEmail } from '../../pages/Profile/AccountAlerts/email.ts';

export const parseRecipients = (input: string): string[] => {
  const seen = new Set<string>();
  return input
    .split(/[;,]/)
    .map((part) => part.trim())
    .filter((part) => {
      const key = part.toLowerCase();
      if (!part || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
};

export const getInvalidRecipients = (recipients: string[]): string[] =>
  recipients.filter((recipient) => !isValidEmail(recipient));
