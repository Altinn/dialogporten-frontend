import { Button, ButtonGroup, Modal, Typography } from '@altinn/altinn-components';
import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createMessageBoxLink } from '../../auth';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { pruneSearchQueryParams } from '../../pages/Inbox/queryParams.ts';
import { PageRoutes } from '../../pages/routes.ts';
import { useGlobalState } from '../../useGlobalState.ts';
import styles from './betaModal.module.css';

const betaKey = 'arbeidsflate:beta-modal-displayed';

export const BetaModal = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const isMock = searchParams.get('mock') === 'true';
  const isFirstTime = localStorage.getItem(betaKey) === null;
  const [isOpen, setIsOpen] = useState<boolean>(isFirstTime);
  const [_, setShowTour] = useGlobalState<boolean>(QUERY_KEYS.SHOW_TOUR, false);
  const { search } = useLocation();

  const onTryBeta = () => {
    localStorage.setItem(betaKey, 'true');
    setIsOpen(false);
    setShowTour(true);
    navigate(PageRoutes.inbox + pruneSearchQueryParams(search));
  };

  const handleClose = () => {
    localStorage.setItem(betaKey, 'true');
    setIsOpen(false);
  };

  if (isMock) return null;

  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      open
      closedBy={isFirstTime ? 'none' : 'closerequest'}
      dismissable={!isFirstTime}
      variant="default"
      onClose={handleClose}
    >
      <Typography>
        <h1>{t('betaModal.title')}</h1>
        <p>
          <Trans i18nKey="betaModal.description" components={{ strong: <strong />, b: <b /> }} />
        </p>
      </Typography>
      <ButtonGroup className={styles.buttons}>
        <Button onClick={onTryBeta}>{t('betaModal.tryButton')}</Button>
        <Button as="a" href={createMessageBoxLink()} variant="outline">
          {t('betaModal.exitButton')}
        </Button>
      </ButtonGroup>
      <Typography size="sm">
        <Link
          target="_blank"
          to={PageRoutes.about + pruneSearchQueryParams(search)}
          onClick={() => localStorage.setItem(betaKey, 'true')}
        >
          {t('betaModal.learnMore')}
        </Link>
      </Typography>
    </Modal>
  );
};
