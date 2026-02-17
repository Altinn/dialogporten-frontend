import { Button, Modal, Typography } from '@altinn/altinn-components';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PreselectedActorModalProps, PreselectedPartyOperationType } from './PartiesOverviewPage';
import styles from './confirmSetPreselectedActorModal.module.css';

interface ConfirmSetPreselectedActorModalProps {
  showActor: PreselectedActorModalProps | null;
  onClose: () => void;
  onConfirm: (partyUuid: string, operationType: PreselectedPartyOperationType) => Promise<void>;
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
    if (!showActor?.party?.uuid) return;
    setIsSubmitting(true);
    try {
      await onConfirm(showActor.party.uuid, showActor.operation);
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
        {showActor.operation === 'set' ? (
          <p>{t('profile.parties.confirm_set_preselected_actor', { name: showActor?.party?.name })}</p>
        ) : (
          <p>{t('profile.parties.confirm_unset_preselected_actor', { name: showActor?.party?.name })}</p>
        )}
      </Typography>

      <div className={styles.buttonGroupContainer}>
        <Button onClick={onClose} variant="outline" disabled={isSubmitting} type="button">
          {t('profile.parties.cancel')}
        </Button>
        <Button onClick={handleConfirm} disabled={isSubmitting} type="button">
          {showActor.operation === 'set'
            ? t('profile.parties.confirm_set_preselected_actor_button')
            : t('profile.parties.confirm_unset_preselected_actor_button')}
        </Button>
      </div>
    </Modal>
  );
};
