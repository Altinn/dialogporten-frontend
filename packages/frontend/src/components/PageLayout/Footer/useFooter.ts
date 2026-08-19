import { type FooterProps, type MenuItemProps, useConsent } from '@altinn/altinn-components';
import { useTranslation } from 'react-i18next';
import { createInfoPortalLink } from '../../../auth/url.ts';
import { useFeatureFlag } from '../../../featureFlags';

export const useFooter = (): FooterProps => {
  const { t, i18n } = useTranslation();
  const { clear } = useConsent();
  const isSkyraEnabled = useFeatureFlag<boolean>('global.enableSkyra');
  const language = i18n.language;

  return {
    address: t('footer.address'),
    address2: t('footer.address2'),
    menu: {
      items: [
        {
          id: 'footer.nav.help_contact',
          title: t('footer.nav.help_contact'),
          href: createInfoPortalLink({ nb: '/hjelp/', en: '/en/help/', nn: '/nn/hjelp/' }, language),
        },
        {
          id: 'footer.nav.about_altinn',
          title: t('footer.nav.about_altinn'),
          href: createInfoPortalLink({ nb: '/om-altinn/', en: '/en/about-altinn/', nn: '/nn/om-altinn/' }, language),
        },
        {
          id: 'footer.nav.service_announcements',
          title: t('footer.nav.service_announcements'),
          href: createInfoPortalLink(
            {
              nb: '/om-altinn/driftsmeldinger/',
              en: '/en/about-altinn/service-announcements/',
              nn: '/nn/om-altinn/driftsmeldingar/',
            },
            language,
          ),
        },
        {
          id: 'footer.nav.privacy_policy',
          title: t('footer.nav.privacy_policy'),
          href: createInfoPortalLink(
            { nb: '/om-altinn/personvern/', en: '/en/about-altinn/privacy/', nn: '/nn/om-altinn/personvern/' },
            language,
          ),
        },
        {
          id: 'footer.nav.accessibility',
          title: t('footer.nav.accessibility'),
          href: createInfoPortalLink(
            {
              nb: '/om-altinn/tilgjengelighet/',
              en: '/en/about-altinn/tilgjengelighet/',
              nn: '/nn/om-altinn/tilgjengelighet/',
            },
            language,
          ),
        },
        ...(isSkyraEnabled
          ? [
              {
                id: 'footer.nav.cookies',
                title: t('footer.nav.cookies'),
                as: 'button' as MenuItemProps['as'],
                onClick: () => {
                  clear();
                  window?.scrollTo({ top: 0, behavior: 'instant' });
                },
              },
            ]
          : []),
      ],
    },
  };
};
