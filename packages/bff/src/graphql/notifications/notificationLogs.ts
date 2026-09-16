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

const isDelivered = (status?: string | null): boolean => normalize(status) === 'delivered';

export const filterNotificationLogs = (logs: unknown): NotificationLogEntry[] => {
  if (!Array.isArray(logs)) return [];
  return logs.filter(
    (log): log is NotificationLogEntry => !!log && !excludedTypes.has(normalize(log.type)) && isDelivered(log.status),
  );
};
