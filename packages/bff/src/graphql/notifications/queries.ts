import { extendType, list, nonNull, stringArg } from 'nexus';
import { assertDialogAccess } from '../shared/dialogAccess.ts';
import {
  getNotificationAddressByOrgNumber,
  getNotificationLogs,
  getNotificationsettingsForCurrentUser,
  getVerifiedAddresses,
} from './service.ts';
import { OrganizationResponse } from './types.ts';

export const NotificationsQuery = extendType({
  type: 'Query',
  definition(t) {
    t.field('notificationsettingsForCurrentUser', {
      type: list('NotificationSettingsResponse'),
      resolve: async (_source, _args, ctx) => {
        return (await getNotificationsettingsForCurrentUser(ctx)) ?? null;
      },
    });

    t.field('verifiedAddresses', {
      type: list('VerifiedAddressResponse'),
      resolve: async (_source, _args, ctx) => {
        return (await getVerifiedAddresses(ctx)) ?? [];
      },
    });

    t.field('notificationLogs', {
      type: list('NotificationLogsResponse'),
      args: {
        dialogId: nonNull(stringArg()),
      },
      resolve: async (_source, { dialogId }, ctx) => {
        await assertDialogAccess(dialogId, ctx);
        return (await getNotificationLogs(dialogId)) ?? [];
      },
    });

    // TODO: (Breaking change) Poor choice of naming for this field, remove 'get-'
    t.field('getNotificationAddressByOrgNumber', {
      type: OrganizationResponse,
      args: {
        orgnr: stringArg(),
      },
      resolve: async (_source, { orgnr }, ctx) => {
        if (orgnr) {
          return (await getNotificationAddressByOrgNumber(orgnr, ctx)) ?? null;
        }
        return null;
      },
    });
  },
});
