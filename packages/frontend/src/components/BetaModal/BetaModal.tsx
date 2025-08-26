import { Button, ButtonGroup, FloatingActionButton, Modal, Typography } from '@altinn/altinn-components';
import { InformationSquareIcon } from '@navikt/aksel-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { createMessageBoxLink } from '../../auth';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { PageRoutes } from '../../pages/routes.ts';
import { useGlobalState } from '../../useGlobalState.ts';

const betaKey = 'arbeidsflate:beta-modal-displayed';

/* TODO: i18n pages when texts are ready */
export const BetaModal = () => {
  // Set default to true if this is first time for this user
  const { t } = useTranslation();
  const searchParams = new URLSearchParams(window.location.search);
  const isMock = searchParams.get('mock') === 'true';
  const isFirstTime = localStorage.getItem(betaKey) === null;
  const [isOpen, setIsOpen] = useState<boolean>(isFirstTime);
  const [_, setShowTour] = useGlobalState<boolean>(QUERY_KEYS.SHOW_TOUR, false);

  const onTryBeta = () => {
    localStorage.setItem(betaKey, 'true');
    setIsOpen(false);
    setShowTour(true);
  };

  if (isMock) {
    return null;
  }

  if (isOpen) {
    return (
      <Modal open closedBy="none" variant="default" onClose={onTryBeta}>
        <Typography>
          <h1>Prøv den nye innboksen</h1>
          <p>
            Vi pusser opp innboksen og du får sniktitte på en tidlig versjon! Den er fortsatt under utvikling, så noen
            meldinger kan mangle. Vi håper likevel du vil prøve.
          </p>
        </Typography>
        <ButtonGroup>
          <Button onClick={onTryBeta}>{t('altinn.beta.try')}</Button>
          <Button as="a" href={createMessageBoxLink()} variant="outline">
            {t('altinn.beta.exit')}
          </Button>
        </ButtonGroup>
        <Typography size="sm">
          <Link target="_blank" to={PageRoutes.about}>
            Hvorfor oppdaterer vi Altinn?
          </Link>
        </Typography>
      </Modal>
    );
  }

  return <FloatingActionButton onClick={() => setIsOpen(true)} icon={InformationSquareIcon} iconAltText="Om Beta" />;
};
