import { Modal, ModalBody, ModalHeader, SeenByLog, type SeenByLogItemProps } from '@altinn/altinn-components';
import { useTranslation } from 'react-i18next';

export interface ActivityLogModalProps {
  title?: string;
  isOpen: boolean;
  onClose: () => void;
  items?: SeenByLogItemProps[];
}

export const SeenByModal = ({ title, items, isOpen, onClose }: ActivityLogModalProps) => {
  const { t } = useTranslation();
  if (!isOpen || !items || items.length === 0) {
    return null;
  }

  return (
    <Modal padding={0} spacing={0} open={isOpen} onClose={() => onClose()} variant="content">
      <ModalHeader title={title} onClose={() => onClose()} closeTitle={t('word.close')} />
      <ModalBody>
        <SeenByLog items={items} endUserLabel={t('word.you')} />
      </ModalBody>
    </Modal>
  );
};
