import i18n from 'i18next';
import ICU from 'i18next-icu';
import { initReactI18next } from 'react-i18next';

import en from './resources/en.json';
import nb from './resources/nb.json';
import nn from './resources/nn.json';

const i18nInitConfig = {
  resources: {
    nb: { translation: nb },
    en: { translation: en },
    nn: { translation: nn },
  },
  lng: 'nb',
  fallbackLng: 'nb',
  debug: false,
  interpolation: {
    escapeValue: false,
  },
};

i18n.use(ICU).use(initReactI18next).init(i18nInitConfig);

export { i18n };
