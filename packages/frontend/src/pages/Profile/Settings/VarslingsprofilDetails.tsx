import { Button, ButtonGroup } from '@altinn/altinn-components';
import { useTranslation } from 'react-i18next';

export const VarslingsprofilDetails = () => {
  const { t } = useTranslation();

  const handleClose = () => {
    document.activeElement?.closest('dialog')?.close();
  };

  return (
    <>
      <ButtonGroup size="md">
        <Button variant="primary" onClick={handleClose}>
          {t('profile.settings.change')}
        </Button>
        <Button variant="outline" onClick={handleClose}>
          {t('profile.parties.cancel')}
        </Button>
      </ButtonGroup>
    </>
  );
};
