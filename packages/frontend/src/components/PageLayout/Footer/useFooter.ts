import { type FooterProps, type MenuItemProps, useConsent } from '@altinn/altinn-components';
import { useTranslation } from 'react-i18next';
import { getInfoPortalLink } from '../../../auth/url.ts';
import { useFeatureFlag } from '../../../featureFlags';

export const useFooter = (): FooterProps => {
  const { t, i18n } = useTranslation();
  const { clear } = useConsent();
  const isCookieBannerEnabled = useFeatureFlag<boolean>('global.enableCookieBanner');
  const language = i18n.language;

  return {
    address: t('footer.address'),
    address2: t('footer.address2'),
    menu: {
      items: [
        {
          id: 'footer.nav.help_contact',
          title: t('footer.nav.help_contact'),
          href: getInfoPortalLink('help', language),
        },
        {
          id: 'footer.nav.about_altinn',
          title: t('footer.nav.about_altinn'),
          href: getInfoPortalLink('aboutAltinn', language),
        },
        {
          id: 'footer.nav.service_announcements',
          title: t('footer.nav.service_announcements'),
          href: getInfoPortalLink('serviceAnnouncements', language),
        },
        {
          id: 'footer.nav.privacy_policy',
          title: t('footer.nav.privacy_policy'),
          href: getInfoPortalLink('privacy', language),
        },
        {
          id: 'footer.nav.accessibility',
          title: t('footer.nav.accessibility'),
          href: getInfoPortalLink('accessibility', language),
        },
        ...(isCookieBannerEnabled
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
