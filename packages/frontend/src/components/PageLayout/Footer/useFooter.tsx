import type { FooterProps } from '@altinn/altinn-components';
import { useTranslation } from 'react-i18next';

const footerLinks = [
  {
    href: 'https://info.altinn.no/om-altinn/',
    resourceId: 'footer.nav.about_altinn',
  },
  {
    href: 'https://info.altinn.no/om-altinn/driftsmeldinger/',
    resourceId: 'footer.nav.service_messages',
  },
  {
    href: 'https://info.altinn.no/om-altinn/personvern/',
    resourceId: 'footer.nav.privacy_policy',
  },
  {
    href: 'https://info.altinn.no/om-altinn/tilgjengelighet/',
    resourceId: 'footer.nav.accessibility',
  },
];

export const useFooter = (): FooterProps => {
  const { t } = useTranslation();
  return {
    address: 'Postboks 6783 St. Olavs plass, 0130 Oslo',
    address2: 'Org.nr. 991 825 827',
    menu: {
      items: footerLinks.map((link) => ({
        id: link.resourceId,
        href: link.href,
        title: t(link.resourceId),
      })),
    },
  };
};
