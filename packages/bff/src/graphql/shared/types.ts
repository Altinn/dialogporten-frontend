import { objectType } from 'nexus';

export const Response = objectType({
  name: 'Response',
  definition(t) {
    t.nonNull.boolean('success');
    t.string('message');
    t.nullable.int('retryAfter');
  },
});

export const ProblemDetails = objectType({
  name: 'ProblemDetails',
  definition(t) {
    t.nullable.string('type', { resolve: (obj) => obj.type });
    t.nullable.string('title', { resolve: (obj) => obj.title });
    t.nullable.int('status', { resolve: (obj) => obj.status });
    t.nullable.string('detail', { resolve: (obj) => obj.detail });
    t.nullable.string('instance', { resolve: (obj) => obj.instance });
  },
});
