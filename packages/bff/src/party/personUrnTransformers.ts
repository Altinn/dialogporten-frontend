import { encryptPersonUrn } from './personUrnCipher.ts';

const encryptField = (obj: unknown, field: string): void => {
  if (obj && typeof obj === 'object' && field in obj) {
    const record = obj as Record<string, unknown>;
    record[field] = encryptPersonUrn(record[field]);
  }
};

const fieldTransformers: Record<string, (value: unknown) => void> = {
  dialogById: (value) => {
    const dialog = (value as { dialog?: unknown } | null | undefined)?.dialog;
    encryptField(dialog, 'party');
  },
  searchDialogs: (value) => {
    const items = (value as { items?: unknown[] } | null | undefined)?.items;
    if (Array.isArray(items)) {
      for (const item of items) encryptField(item, 'party');
    }
  },
  parties: (value) => {
    if (Array.isArray(value)) {
      for (const party of value) encryptField(party, 'party');
    }
  },
};

export const encryptPersonUrnsInResponse = <T>(_operationName: string | undefined, response: T): T => {
  if (!response || typeof response !== 'object') return response;
  const data = (response as { data?: Record<string, unknown> }).data;
  if (!data) return response;
  for (const field of Object.keys(data)) {
    fieldTransformers[field]?.(data[field]);
  }
  return response;
};
