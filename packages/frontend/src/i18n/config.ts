import i18n from 'i18next';
import ICU from 'i18next-icu';
import { initReactI18next } from 'react-i18next';

import en from './resources/en.json';
import nb from './resources/nb.json';
import nn from './resources/nn.json';

const isI18nDisabled = window.location.search.includes('i18n=false');
const emptyTranslation = { translation: {} };

const i18nInitConfig = {
  resources: {
    nb: isI18nDisabled ? emptyTranslation : { translation: nb },
    en: isI18nDisabled ? emptyTranslation : { translation: en },
    nn: isI18nDisabled ? emptyTranslation : { translation: nn },
  },
  lng: 'nb',
  fallbackLng: 'nb',
  debug: false,
  interpolation: {
    escapeValue: false,
  },
};

i18n.use(ICU).use(initReactI18next).init(i18nInitConfig);

document.documentElement.lang = 'nb';
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
});

export { i18n };
