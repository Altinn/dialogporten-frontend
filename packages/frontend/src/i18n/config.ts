import i18n from 'i18next';
import ICU from 'i18next-icu';
import { initReactI18next } from 'react-i18next';

import nb from './resources/nb.json';

const isI18nDisabled = window.location.search.includes('i18n=false');
const emptyTranslation = { translation: {} };

const i18nInitConfig = {
  resources: {
    nb: isI18nDisabled ? emptyTranslation : { translation: nb },
  },
  lng: 'nb',
  fallbackLng: 'nb',
  debug: false,
  interpolation: {
    escapeValue: false,
  },
};

i18n.use(ICU).use(initReactI18next).init(i18nInitConfig);

export async function loadLocale(language: string): Promise<void> {
  if (isI18nDisabled || language === 'nb' || i18n.hasResourceBundle(language, 'translation')) return;
  const { default: translations } = await import(`./resources/${language}.json`);
  i18n.addResourceBundle(language, 'translation', translations);
}

document.documentElement.lang = 'nb';
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
});

export { i18n };
