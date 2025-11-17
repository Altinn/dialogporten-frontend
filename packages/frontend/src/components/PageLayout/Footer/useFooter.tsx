import type { FooterProps } from '@altinn/altinn-components';
import { useTranslation } from 'react-i18next';
import { useParties } from '../../../api/hooks/useParties';
import { getFooterLinks } from '../../../auth/url';

export const useFooter = (): FooterProps => {
  const { t, i18n } = useTranslation();
  const { currentPartyUuid } = useParties();
  const footerLinks = getFooterLinks(currentPartyUuid || '', i18n.language);

  return {
    address: 'Postboks 1382 Vika, 0114 Oslo.',
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
