import { useTour } from '@reactour/tour';
import { useEffect, useState } from 'react';
import { OnboardingPopover } from './OnboardingPopover';

interface UseProfileOnboardingProps {
  isLoading: boolean;
}

const PROFILE_ONBOARDING_KEY = 'arbeidsflate:profile-onboarding-completed';

const profileTourSteps = [
  {
    selector: '[data-testid="dashboard-header"]',
    content: <OnboardingPopover titleKey="first profile tour step" infoTextKey="some text about the profile page" />,
  },
];

export const useProfileOnboarding = ({ isLoading }: UseProfileOnboardingProps) => {
  const tour = useTour();
  const { setIsOpen, setCurrentStep } = tour;
  const [hasInitialized, setHasInitialized] = useState(false);
  const hasCompletedOnboarding = localStorage.getItem(PROFILE_ONBOARDING_KEY) === 'true';
  const shouldInitializeTour = !isLoading && !hasInitialized && !hasCompletedOnboarding;

  useEffect(() => {
    if (shouldInitializeTour) {
      if ('setSteps' in tour && typeof tour.setSteps === 'function') {
        tour.setSteps(profileTourSteps);
      }

      setCurrentStep(0);
      setIsOpen(true);
      setHasInitialized(true);
    }
  }, [shouldInitializeTour, tour, setIsOpen, setCurrentStep]);

  useEffect(() => {
    if (!tour.isOpen && hasInitialized) {
      localStorage.setItem(PROFILE_ONBOARDING_KEY, 'true');
      setHasInitialized(false);
    }
  }, [tour.isOpen, hasInitialized]);
};
