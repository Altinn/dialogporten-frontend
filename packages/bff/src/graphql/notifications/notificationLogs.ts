export interface NotificationLogEntry {
  notificationId: string;
  dialogId?: string | null;
  transmissionId?: string | null;
  type?: string | null;
  channel?: string | null;
  destination?: string | null;
  status?: string | null;
  requestedSendTime?: string | null;
  lastUpdateTime?: string | null;
}

const excludedTypes: ReadonlySet<string> = new Set(['composed', 'instant']);

const normalize = (value?: string | null): string => (value ?? '').trim().toLowerCase();

const excludedStatuses: ReadonlySet<string> = new Set(['failed_recipientnotidentified']);

const isShownStatus = (status?: string | null): boolean => {
  const value = normalize(status);
  if (excludedStatuses.has(value)) return false;
  return value === 'delivered' || value === 'failed' || value.startsWith('failed_');
};

export const filterNotificationLogs = (logs: unknown): NotificationLogEntry[] => {
  if (!Array.isArray(logs)) return [];
  return logs.filter(
    (log): log is NotificationLogEntry => !!log && !excludedTypes.has(normalize(log.type)) && isShownStatus(log.status),
  );
};
