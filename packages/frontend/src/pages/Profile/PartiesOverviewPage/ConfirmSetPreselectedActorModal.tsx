import { Button, ButtonGroup, Modal, Typography } from '@altinn/altinn-components';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PartyItemProp } from '../../../components/PageLayout/Accounts/useAccounts';

interface ConfirmSetPreselectedActorModalProps {
  showActor: PartyItemProp | null;
  onClose: () => void;
  onConfirm: (partyUuid: string) => Promise<void>;
}

export const ConfirmSetPreselectedActorModal = ({
  showActor,
  onClose,
  onConfirm,
}: ConfirmSetPreselectedActorModalProps) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!showActor) return null;

  const handleConfirm = async () => {
    if (!showActor?.uuid) return;
    setIsSubmitting(true);
    try {
      await onConfirm(showActor.uuid);
      onClose();
    } catch (error) {
      // Error is logged in the mutation handler
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={!!showActor} onClose={onClose} closedBy="none">
      <Typography>
        <p>{t('profile.parties.confirm_set_preselected_actor', { name: showActor?.name })}</p>
      </Typography>
      <ButtonGroup>
        <Button onClick={onClose} variant="outline" disabled={isSubmitting}>
          {t('profile.parties.cancel')}
        </Button>
        <Button onClick={handleConfirm} disabled={isSubmitting}>
          {t('profile.parties.confirm_set_preselected_actor_button')}
        </Button>
      </ButtonGroup>
    </Modal>
  );
};
