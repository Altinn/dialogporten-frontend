import { enumType, objectType } from 'nexus';

export const CorrespondenceForwardingConstraint = enumType({
  name: 'CorrespondenceForwardingConstraint',
  description: 'Why the attachments cannot be included when forwarding a correspondence by email',
  members: [
    { name: 'NONE', description: 'The attachments can be included, or forwarding is not allowed' },
    { name: 'ATTACHMENTS_EXCEED_MAX_LIMIT', description: 'The attachments are larger than 10 MB in total' },
    { name: 'NOT_ACCESS_TO_ALL_ATTACHMENTS', description: 'The user does not have access to all the attachments' },
    { name: 'EXPIRING_ATTACHMENTS', description: 'One or more attachments have an expiry date' },
    { name: 'UNKNOWN', description: 'Correspondence reported a constraint this BFF does not recognise' },
  ],
});

export const CorrespondenceForwardingCheck = objectType({
  name: 'CorrespondenceForwardingCheck',
  description: 'Whether the signed-in user can forward a correspondence by email',
  definition(t) {
    t.nonNull.boolean('allowed', {
      description: 'True only when the correspondence allows forwarding; false when it does not or the check failed',
    });
    t.nonNull.field('forwardingConstraint', {
      type: CorrespondenceForwardingConstraint,
      description:
        'Why the attachments cannot be included when forwarding is allowed; NONE when they can be, or when forwarding is not allowed',
    });
  },
});

export const ForwardCorrespondenceResult = objectType({
  name: 'ForwardCorrespondenceResult',
  description: 'Outcome of forwarding a correspondence by email',
  definition(t) {
    t.nonNull.boolean('success');
    t.nullable.int('status', {
      description: 'HTTP status from Correspondence when the forward failed',
    });
    t.nullable.int('errorCode', {
      description: 'Correspondence error code from the problem details when the forward failed',
    });
  },
});
