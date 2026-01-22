import { Button, ButtonGroup, Modal, Typography } from '@altinn/altinn-components';
import { useTranslation } from 'react-i18next';
import type { PartyItemProp } from '../../../components/PageLayout/Accounts/useAccounts';

interface ConfirmSetPreselectedActorModalProps {
  showActor: boolean | PartyItemProp;
  onClose: () => void;
  onConfirm: (partyUuid: string) => void;
}

export const ConfirmSetPreselectedActorModal = ({
  showActor,
  onClose,
  onConfirm,
}: ConfirmSetPreselectedActorModalProps) => {
  const { t } = useTranslation();
  if (!showActor || typeof showActor === 'boolean') return null;
  return (
    <Modal open={!!showActor} onClose={onClose} closedBy="none">
      <Typography>
        <p>{t('profile.parties.confirm_set_preselected_actor', { name: showActor?.name })}</p>
      </Typography>
      <ButtonGroup>
        <Button onClick={onClose} variant="outline">
          {t('profile.parties.cancel')}
        </Button>
        <Button
          onClick={() => {
            onConfirm(showActor.uuid);
            onClose();
          }}
        >
          {t('profile.parties.confirm_set_preselected_actor_button')}
        </Button>
      </ButtonGroup>
    </Modal>
  );
};
