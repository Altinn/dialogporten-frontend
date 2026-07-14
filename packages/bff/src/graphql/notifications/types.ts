import { inputObjectType, objectType } from 'nexus';

export const NotificationAddressModel = objectType({
  name: 'NotificationAddressModel',
  description: 'Represents a notification address',
  definition(t) {
    t.nullable.string('countryCode', {
      description: 'Country code for phone number',
      resolve: (obj) => obj.countryCode,
    });
    t.nullable.string('email', {
      description: 'Email address',
      resolve: (obj) => obj.email,
    });
    t.nullable.string('phone', {
      description: 'Phone number',
      resolve: (obj) => obj.phone,
    });
  },
});

export const NotificationAddressResponse = objectType({
  name: 'NotificationAddressResponse',
  description: 'Represents a notification address',
  definition(t) {
    t.nullable.string('countryCode', {
      description: 'Country code for phone number',
      resolve: (obj) => obj.countryCode,
    });
    t.nullable.string('email', {
      description: 'Email address',
      resolve: (obj) => obj.email,
    });
    t.nullable.string('phone', {
      description: 'Phone number',
      resolve: (obj) => obj.phone,
    });
    t.int('notificationAddressId', {
      description: 'Altinn.Profile.Models.NotificationAddressResponse.NotificationAddressId',
      resolve: (obj) => obj.notificationAddressId,
    });
  },
});

export const OrganizationResponse = objectType({
  name: 'OrganizationResponse',
  description: 'Represents an organization with notification addresses',
  definition(t) {
    t.nullable.string('organizationNumber', {
      description: "The organization's organization number",
      resolve: (obj) => obj.organizationNumber,
    });
    t.nullable.list.field('notificationAddresses', {
      type: 'NotificationAddressResponse',
      description: 'Represents a list of mandatory notification address',
      resolve: (obj) => obj.notificationAddresses,
    });
    t.nullable.int('status', {
      description: 'The HTTP status code of the upstream request, populated when the request did not succeed',
      resolve: (obj) => obj.status,
    });
  },
});

export const NotificationSettingsResponse = objectType({
  name: 'NotificationSettingsResponse',
  description:
    'Response model for the professional notification address for an organization, also called personal notification address.',
  definition(t) {
    t.nullable.string('emailAddress', {
      description: 'The email address. May be null if no email address is set.',
      resolve: (obj) => obj.emailAddress,
    });
    t.nullable.string('phoneNumber', {
      description: 'The phone number. May be null if no phone number is set.',
      resolve: (obj) => obj.phoneNumber,
    });
    t.nullable.list.string('resourceIncludeList', {
      description:
        'A list of resources that the user has registered to receive notifications for. The format is in URN. This is used to determine which resources the user can receive notifications for.',
      resolve: (obj) => obj.resourceIncludeList,
    });
    t.int('userId', {
      description: 'The user id of logged-in user for whom the specific contact information belongs to.',
      resolve: (obj) => obj.userId,
    });
    t.string('partyUuid', {
      description: 'ID of the party',
      resolve: (obj) => obj.partyUuid,
    });
    t.nullable.string('emailVerificationStatus', {
      description: 'Verification status for the email address (Unverified, Verified, Legacy)',
      resolve: (obj) => obj.emailVerificationStatus,
    });
    t.nullable.string('smsVerificationStatus', {
      description: 'Verification status for the SMS/phone number (Unverified, Verified, Legacy)',
      resolve: (obj) => obj.smsVerificationStatus,
    });
    t.nullable.boolean('needsConfirmation', {
      description: 'Indicates whether the notification settings need confirmation',
      resolve: (obj) => obj.needsConfirmation,
    });
  },
});

export const NotificationSettingsInput = inputObjectType({
  name: 'NotificationSettingsInput',
  definition(t) {
    t.int('userId');
    t.string('partyUuid');
    t.string('emailAddress');
    t.string('phoneNumber');
    t.list.string('resourceIncludeList');
  },
});

export interface NotificationSettingsInputData {
  userId: number;
  partyUuid: string;
  emailAddress?: string;
  phoneNumber?: string;
  resourceIncludeList?: string[];
}

export const VerifyAddressInput = inputObjectType({
  name: 'VerifyAddressInput',
  definition(t) {
    t.string('value');
    t.string('type');
    t.string('verificationCode');
  },
});

export interface VerifyAddressInputData {
  value: string;
  type: 'Email' | 'Sms';
  verificationCode: string;
}

export const SendVerificationCodeInput = inputObjectType({
  name: 'SendVerificationCodeInput',
  definition(t) {
    t.string('value');
    t.string('type');
  },
});

export interface SendVerificationCodeInputData {
  value: string;
  type: 'Email' | 'Sms';
}

export const VerifiedAddressResponse = objectType({
  name: 'VerifiedAddressResponse',
  definition(t) {
    t.nullable.string('value');
    t.nullable.string('addressType', { resolve: (obj) => obj.type ?? null });
  },
});
