import { vitest } from 'vitest';
import { i18n } from '../src/i18n/config';

i18n.init();
window.scrollTo = vitest.fn();
if (!('getAnimations' in document)) {
  Object.defineProperty(document, 'getAnimations', {
    configurable: true,
    value: () => [],
  });
}
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
