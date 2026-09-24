import { objectType } from 'nexus';

export const CorrespondenceForwardingCheck = objectType({
  name: 'CorrespondenceForwardingCheck',
  description: 'Whether the signed-in user can forward a correspondence by email',
  definition(t) {
    t.nonNull.boolean('allowed', {
      description: 'True only when the correspondence allows forwarding; false when it does not or the check failed',
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
