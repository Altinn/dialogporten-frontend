export const isFirefoxOnIOS = (userAgent: string = globalThis.navigator?.userAgent ?? ''): boolean =>
  /FxiOS/i.test(userAgent);
