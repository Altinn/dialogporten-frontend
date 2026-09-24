export interface FormPolicy {
  baseUrl?: string;
  allowSameOrigin?: boolean;
}

export type ResolvedFormAction = { url: string; error?: undefined } | { url?: undefined; error: string };

const localHostnames = ['localhost', '127.0.0.1', '[::1]', '::1'];

const isLocalhost = (hostname: string): boolean => localHostnames.includes(hostname) || hostname.endsWith('.localhost');

const currentOrigin = (): string | undefined => (typeof window === 'undefined' ? undefined : window.location.origin);

export const resolveFormAction = (action: unknown, policy: FormPolicy = {}): ResolvedFormAction => {
  const requested = typeof action === 'string' ? action.trim() : '';
  const target = requested === '' ? policy.baseUrl : requested;

  if (!target) {
    return { error: 'the form has no action, and no baseUrl was configured to submit back to' };
  }

  let url: URL;
  try {
    url = new URL(target, policy.baseUrl ?? (typeof window === 'undefined' ? undefined : window.location.href));
  } catch {
    return { error: `the form action "${target}" is not a valid url` };
  }

  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && isLocalhost(url.hostname))) {
    return { error: `the form action "${url.href}" must use https` };
  }

  if (url.username !== '' || url.password !== '') {
    return { error: 'the form action must not contain credentials' };
  }

  if (!policy.allowSameOrigin && url.origin === currentOrigin()) {
    return { error: `the form action "${url.href}" targets the hosting application itself` };
  }

  return { url: url.href };
};
