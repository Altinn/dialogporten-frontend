import { FloatingDropdown as FloatingDropdownAc } from '@altinn/altinn-components';
import { LeaveIcon, QuestionmarkIcon } from '@navikt/aksel-icons';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { createMessageBoxLink } from '../../auth';
import { QUERY_KEYS } from '../../constants/queryKeys';
import { PageRoutes } from '../../pages/routes';
import { useGlobalState } from '../../useGlobalState';

export const FloatingDropdown = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [_, setShowTour] = useGlobalState<boolean>(QUERY_KEYS.SHOW_TOUR, false);
  const [__, setShowProfileTour] = useGlobalState<boolean>(QUERY_KEYS.SHOW_PROFILE_TOUR, false);

  const handleStartTour = () => {
    const isProfilePage = location.pathname.startsWith('/profile');
    if (isProfilePage) {
      setShowProfileTour(true);
    } else {
      // For inbox we need to navigate to main view to show the tour properly
      navigate(PageRoutes.inbox);
      setShowTour(true);
    }
  };

  const handleGoBack = () => {
    window.location.href = createMessageBoxLink();
  };

  return (
    <FloatingDropdownAc
      icon={QuestionmarkIcon}
      iconAltText={'?'}
      items={[
        {
          icon: QuestionmarkIcon,
          title: t('floating_dropdown.show_new_functionality'),
          onClick: handleStartTour,
        },
        {
          icon: LeaveIcon,
          title: t('altinn.beta.exit'),
          onClick: handleGoBack,
        },
      ]}
    />
  );
};
