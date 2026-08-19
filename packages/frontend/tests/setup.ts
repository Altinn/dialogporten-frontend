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
const originalMatches = Element.prototype.matches;
Element.prototype.matches = function matches(selector: string): boolean {
  if (selector.includes(':popover-open')) {
    return false;
  }
  return originalMatches.call(this, selector);
};

const cssNamespace = globalThis as unknown as { CSS?: { escape?: (value: string) => string } };
if (typeof cssNamespace.CSS?.escape !== 'function') {
  cssNamespace.CSS = {
    ...cssNamespace.CSS,
    escape: (value: string) => String(value).replace(/[^\w\u00A0-\uFFFF-]/g, (char) => `\\${char}`),
  };
}
