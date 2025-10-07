import { useTour } from '@reactour/tour';
import { useEffect, useState } from 'react';
import { OnboardingPopover } from './OnboardingPopover';

interface UseProfileNotificationsOnboardingProps {
  isLoading: boolean;
}

const PROFILE_NOTIFICATIONS_ONBOARDING_KEY = 'arbeidsflate:profile-notifications-onboarding-completed';

const profileNotificationsTourSteps = [
  {
    selector: 'aside nav',
    content: <OnboardingPopover titleKey="Test title" infoTextKey="Some info here" />,
  },
];

export const useProfileNotificationsOnboarding = ({ isLoading }: UseProfileNotificationsOnboardingProps) => {
  const tour = useTour();
  const { setIsOpen, setCurrentStep } = tour;
  const [hasInitialized, setHasInitialized] = useState(false);
  const hasCompletedOnboarding = localStorage.getItem(PROFILE_NOTIFICATIONS_ONBOARDING_KEY) === 'true';
  const shouldInitializeTour = !isLoading && !hasInitialized && !hasCompletedOnboarding;

  useEffect(() => {
    if (shouldInitializeTour) {
      if ('setSteps' in tour && typeof tour.setSteps === 'function') {
        tour.setSteps(profileNotificationsTourSteps);
      }

      setCurrentStep(0);
      setIsOpen(true);
      setHasInitialized(true);
    }
  }, [shouldInitializeTour, tour, setIsOpen, setCurrentStep]);

  useEffect(() => {
    if (!tour.isOpen && hasInitialized) {
      localStorage.setItem(PROFILE_NOTIFICATIONS_ONBOARDING_KEY, 'true');
      setHasInitialized(false);
    }
  }, [tour.isOpen, hasInitialized]);
};
