import { objectType } from 'nexus';

export const CorrespondenceForwardingCheck = objectType({
  name: 'CorrespondenceForwardingCheck',
  description: 'Whether the signed-in user can forward a correspondence by email',
  definition(t) {
    t.nonNull.boolean('allowed', {
      description: 'True only when the correspondence allows forwarding; false when it does not or the check failed',
    });
    t.nullable.string('forwardUrl', {
      description: 'Endpoint to POST the forward request to with the dialog token, set only when allowed',
    });
  },
});
