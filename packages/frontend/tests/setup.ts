import { vitest } from 'vitest';
import { i18n } from '../src/i18n/config';

i18n.init();
window.scrollTo = vitest.fn();
