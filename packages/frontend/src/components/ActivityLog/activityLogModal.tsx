import { ActivityLog, Modal, ModalBody, ModalHeader } from '@altinn/altinn-components';
import type { ActivityLogSegmentProps } from '@altinn/altinn-components/dist/types/lib/components';
import { useTranslation } from 'react-i18next';

export interface ActivityLogModalProps {
  title: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  items: ActivityLogSegmentProps[];
  id?: string;
}

export const ActivityLogModal = ({ title, items, isOpen, setIsOpen }: ActivityLogModalProps) => {
  const { t } = useTranslation();
  return (
    <Modal padding={0} spacing={0} open={isOpen} onClose={() => setIsOpen(false)} variant="content">
      <ModalHeader title={title} onClose={() => setIsOpen(false)} closeTitle={t('word.close')} />
      <ModalBody>
        <ActivityLog items={items} />
      </ModalBody>
    </Modal>
  );
};
