import type { FooterProps } from '@altinn/altinn-components';
import { useTranslation } from 'react-i18next';
import { useCurrentPartyUuid } from '../../../api/hooks/usePartiesSelectors';
import { getFooterLinks } from '../../../auth';

export const useFooter = (): FooterProps => {
  const { t, i18n } = useTranslation();
  const currentPartyUuid = useCurrentPartyUuid();
  const footerLinks = getFooterLinks(currentPartyUuid || '', i18n.language);

  return {
    address: t('footer.address'),
    address2: t('footer.address2'),
    menu: {
      items: footerLinks.map((link) => ({
        id: link.resourceId,
        href: link.href,
        title: t(link.resourceId),
      })),
    },
  };
};
