import { Button, Checkbox, Modal, Typography } from '@altinn/altinn-components';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useParties } from '../../api/hooks/useParties';
import { getAboutNewAltinnLink } from '../../auth';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { pruneSearchQueryParams } from '../../pages/Inbox/queryParams.ts';
import { PageRoutes } from '../../pages/routes.ts';
import { useGlobalState } from '../../useGlobalState.ts';
import styles from './betaModal.module.css';

const betaKey = 'arbeidsflate:beta-modal-displayed';
const INBOX_ONBOARDING_KEY = 'arbeidsflate:inbox-onboarding-displayed';
const PROFILE_MAIN_ONBOARDING_KEY = 'arbeidsflate:profile-main-onboarding-completed';
const PROFILE_PARTIES_ONBOARDING_KEY = 'arbeidsflate:profile-parties-onboarding-completed';

export const BetaModal = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { currentPartyUuid } = useParties();
  const searchParams = new URLSearchParams(window.location.search);
  const isMock = searchParams.get('mock') === 'true';
  const [isOpen, setIsOpen] = useState<boolean>(localStorage.getItem(betaKey) === null);
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(false);
  const [_, setShowTour] = useGlobalState<boolean>(QUERY_KEYS.SHOW_TOUR, false);
  const [__, setShowProfileTour] = useGlobalState<boolean>(QUERY_KEYS.SHOW_PROFILE_TOUR, false);
  const { search, pathname } = useLocation();
  const learnMoreLink = getAboutNewAltinnLink(currentPartyUuid, i18n.language);
  const isProfilePage = pathname.startsWith(PageRoutes.profile);
  const isDialogDetails = pathname.startsWith('/inbox/');

  const handleOk = () => {
    if (dontShowAgain) {
      localStorage.setItem(betaKey, 'true');
    }
    setIsOpen(false);

    if (isProfilePage) {
      const isPartiesPage = pathname === PageRoutes.partiesOverview;
      const profileOnboardingKey = isPartiesPage ? PROFILE_PARTIES_ONBOARDING_KEY : PROFILE_MAIN_ONBOARDING_KEY;
      const hasCompletedProfileOnboarding = localStorage.getItem(profileOnboardingKey) === 'true';

      if (!hasCompletedProfileOnboarding) {
        setShowProfileTour(true);
      }
    } else {
      const hasCompletedInboxOnboarding = localStorage.getItem(INBOX_ONBOARDING_KEY) === 'true';

      if (!hasCompletedInboxOnboarding) {
        setShowTour(true);
      }
      navigate(PageRoutes.inbox + pruneSearchQueryParams(search));
    }
  };

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem(betaKey, 'true');
    }
    setIsOpen(false);
  };

  if (isMock || isDialogDetails) return null;

  if (!isOpen) {
    return null;
  }

  return (
    <Modal open closedBy="closerequest" dismissable variant="default" onClose={handleClose}>
      <Typography className={styles.textContent}>
        <h1>{t('betaModal.title')}</h1>
        <p>{t('betaModal.description')}</p>
        <a href={learnMoreLink} target="_blank" rel="noopener noreferrer">
          {t('betaModal.learnMore')}
        </a>
      </Typography>

      <div className={styles.controls}>
        <Checkbox
          label={t('betaModal.dontShowAgain')}
          checked={dontShowAgain}
          onChange={(e) => setDontShowAgain(e.target.checked)}
        />
        <Button className={styles.okButton} onClick={handleOk}>
          {t('betaModal.okButton')}
        </Button>
      </div>
    </Modal>
  );
};
