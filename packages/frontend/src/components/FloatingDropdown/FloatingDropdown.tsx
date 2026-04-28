import { FloatingDropdown as FloatingDropdownAc } from '@altinn/altinn-components';
import { ExternalLinkIcon, LeaveIcon, QuestionmarkIcon } from '@navikt/aksel-icons';
import { useTranslation } from 'react-i18next';
import { useCurrentPartyUuid } from '../../api/hooks/usePartiesSelectors';
import { createMessageBoxLink, getNeedHelpLink } from '../../auth';
import { i18n } from '../../i18n/config';

export const FloatingDropdown = () => {
  const { t } = useTranslation();
  const currentPartyUuid = useCurrentPartyUuid();

  const handleGoBack = () => {
    window.location.href = createMessageBoxLink(currentPartyUuid);
  };

  const handleGoToHelp = () => {
    window.location.href = getNeedHelpLink(currentPartyUuid, i18n.language);
  };

  const items = [
    {
      icon: ExternalLinkIcon,
      title: t('floating_dropdown.help_pages'),
      onClick: handleGoToHelp,
    },
    {
      icon: LeaveIcon,
      title: t('altinn.beta.exit'),
      onClick: handleGoBack,
    },
  ];

  return <FloatingDropdownAc icon={QuestionmarkIcon} iconAltText={t('floatingdropdown.open_alt_text')} items={items} />;
};
