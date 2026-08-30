import { Button, ButtonGroup, Checkbox, Heading, Modal, Typography } from '@altinn/altinn-components';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const ORG_LIMIT_INFO_HELP_URL = 'https://info.altinn.no/hjelp/ny-innboks-beta/sortering-og-sok/';

export interface OrgLimitInfoModalProps {
  isOpen: boolean;
  onClose: (dontShowAgain: boolean) => void;
  count: number;
  max: number;
}

export const OrgLimitInfoModal = ({ isOpen, onClose, count, max }: OrgLimitInfoModalProps) => {
  const { t } = useTranslation();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = () => onClose(dontShowAgain);

  return (
    <Modal open={isOpen} onClose={handleClose} dismissable closeTitle={t('word.close')}>
      <Typography>
        <Heading as="h2">{t('org_limit_info.modal_title')}</Heading>
        <p>{t('org_limit_info.modal_description', { count, max })}</p>
        <ul>
          <li>{t('org_limit_info.modal_bullet_pick_page')}</li>
        </ul>
        <p>{t('org_limit_info.modal_or')}</p>
        <ul>
          <li>{t('org_limit_info.modal_bullet_select_units', { max })}</li>
          <li>{t('org_limit_info.modal_bullet_save_search')}</li>
        </ul>
        <p>
          <a href={ORG_LIMIT_INFO_HELP_URL} target="_blank" rel="noreferrer">
            {t('org_limit_info.modal_help_link')}
          </a>
        </p>
      </Typography>

      <Checkbox
        checked={dontShowAgain}
        onChange={(e) => setDontShowAgain(e.target.checked)}
        label={t('org_limit_info.modal_dont_show_again')}
      />

      <ButtonGroup>
        <Button color="company" onClick={handleClose}>
          {t('org_limit_info.modal_confirm')}
        </Button>
      </ButtonGroup>
    </Modal>
  );
};
