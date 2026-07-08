import { Button, ButtonGroup, Checkbox, Modal, ModalBody, ModalHeader, Typography } from '@altinn/altinn-components';
import { type ReactNode, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

const PARTY_LIMIT_INFO_HELP_URL = 'https://info.altinn.no/hjelp/ny-innboks-beta/sortering-og-sok/';

const HelpLink = ({ children }: { children?: ReactNode }) => (
  <a href={PARTY_LIMIT_INFO_HELP_URL} target="_blank" rel="noreferrer">
    {children}
  </a>
);

export interface PartyLimitInfoModalProps {
  isOpen: boolean;
  onClose: (dontShowAgain: boolean) => void;
  partyLimit: number;
}

export const PartyLimitInfoModal = ({ isOpen, onClose, partyLimit }: PartyLimitInfoModalProps) => {
  const { t } = useTranslation();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = () => onClose(dontShowAgain);

  return (
    <Modal padding={0} spacing={0} open={isOpen} onClose={handleClose} dismissable closeTitle={t('word.close')}>
      <ModalHeader title={t('party_limit_info.modal_title')} onClose={handleClose} closeTitle={t('word.close')} />
      <ModalBody>
        <Typography>
          <p>{t('party_limit_info.modal_description', { max: partyLimit })}</p>
          <ul>
            <li>{t('party_limit_info.modal_bullet_select_page')}</li>
            <li>{t('party_limit_info.modal_bullet_select_parties', { max: partyLimit })}</li>
            <li>{t('party_limit_info.modal_bullet_add_service_filter')}</li>
          </ul>
        </Typography>

        <Checkbox
          checked={dontShowAgain}
          onChange={(e) => setDontShowAgain(e.target.checked)}
          label={t('party_limit_info.modal_dont_show_again')}
        />

        <Typography>
          <p>
            <Trans i18nKey="party_limit_info.modal_read_more" components={{ a: <HelpLink /> }} />
          </p>
        </Typography>

        <ButtonGroup>
          <Button color="company" onClick={handleClose}>
            {t('party_limit_info.modal_confirm')}
          </Button>
        </ButtonGroup>
      </ModalBody>
    </Modal>
  );
};
