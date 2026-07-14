import { extendType, list, stringArg } from 'nexus';
import {
  getNotificationAddressByOrgNumber,
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
