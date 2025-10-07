import { useTour } from '@reactour/tour';
import { useEffect, useState } from 'react';
import { OnboardingPopover } from './OnboardingPopover';

interface UseProfilePartiesOnboardingProps {
  isLoading: boolean;
}

const PROFILE_PARTIES_ONBOARDING_KEY = 'arbeidsflate:profile-parties-onboarding-completed';

const profilePartiesTourSteps = [
  {
    selector: 'aside nav a[href*="parties"]',
    content: <OnboardingPopover titleKey="test title" infoTextKey="test description" />,
  },
];

export const useProfilePartiesOnboarding = ({ isLoading }: UseProfilePartiesOnboardingProps) => {
  const tour = useTour();
  const { setIsOpen, setCurrentStep } = tour;
  const [hasInitialized, setHasInitialized] = useState(false);
  const hasCompletedOnboarding = localStorage.getItem(PROFILE_PARTIES_ONBOARDING_KEY) === 'true';
  const shouldInitializeTour = !isLoading && !hasInitialized && !hasCompletedOnboarding;

  useEffect(() => {
    if (shouldInitializeTour) {
      if ('setSteps' in tour && typeof tour.setSteps === 'function') {
        tour.setSteps(profilePartiesTourSteps);
      }

      setCurrentStep(0);
      setIsOpen(true);
      setHasInitialized(true);
    }
  }, [shouldInitializeTour, tour, setIsOpen, setCurrentStep]);

  useEffect(() => {
    if (!tour.isOpen && hasInitialized) {
      localStorage.setItem(PROFILE_PARTIES_ONBOARDING_KEY, 'true');
      setHasInitialized(false);
    }
  }, [tour.isOpen, hasInitialized]);
};
