import { logger } from '@altinn/dialogporten-node-logger';
import { extendType, stringArg } from 'nexus';
import { Response } from '../shared/types.ts';
import {
  deleteNotificationsSetting,
  sendVerificationCode,
  updateNotificationsSetting,
  updateSIPrivatePhoneNumber,
  verifyAddress,
} from './service.ts';
import { NotificationSettingsInput, SendVerificationCodeInput, VerifyAddressInput } from './types.ts';

export const UpdateNotificationSetting = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('updateNotificationSetting', {
      type: Response,
      args: {
        data: NotificationSettingsInput,
      },
      resolve: async (_, { data }, ctx) => {
        try {
          const response = await updateNotificationsSetting(data, ctx);
          if (typeof response !== 'undefined') {
            return { success: true, message: 'NotificationSetting updated successfully' };
          }
          return { success: false, message: 'NotificationSetting updated failed' };
        } catch (error) {
          logger.error(error, 'Failed to update NotificationSetting:');
          return error;
        }
      },
    });
  },
});

export const DeleteNotificationSetting = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('deleteNotificationSetting', {
      type: Response,
      args: {
        partyUuid: stringArg(),
      },
      resolve: async (_, { partyUuid }, ctx) => {
        try {
          await deleteNotificationsSetting(partyUuid, ctx);
          return { success: true, message: 'NotificationSetting deleted successfully' };
        } catch (error) {
          logger.error(error, 'Failed to delete NotificationSetting:');
          return error;
        }
      },
    });
  },
});

/* This endpoint is responsible for both sending and resending confirmation code */
export const VerifyAddress = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('verifyAddress', {
      type: Response,
      args: {
        data: VerifyAddressInput,
      },
      resolve: async (_, { data }, ctx) => {
        try {
          return await verifyAddress(data, ctx);
        } catch (error) {
          logger.error(error, 'Failed to verify address:');
          return { success: false, message: 'Failed to verify address' };
        }
      },
    });
  },
});

export const SendVerificationCode = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('sendVerificationCode', {
      type: Response,
      args: {
        data: SendVerificationCodeInput,
      },
      resolve: async (_, { data }, ctx) => {
        try {
          return await sendVerificationCode(data, ctx);
        } catch (error) {
          logger.error(error, 'Failed to send verification code:');
          return { success: false, message: 'Failed to send verification code' };
        }
      },
    });
  },
});

export const UpdateSIPrivatePhoneNumber = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('updateSIPrivatePhoneNumber', {
      type: Response,
      args: {
        value: stringArg(),
      },
      resolve: async (_, { value }, ctx) => {
        const result = await updateSIPrivatePhoneNumber(value ?? null, ctx);
        if (result?.success) {
          return { success: true, message: 'Phone number updated successfully' };
        }
        return { success: false, message: 'Failed to update phone number' };
      },
    });
  },
});
