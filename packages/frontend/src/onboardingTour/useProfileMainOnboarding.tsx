import { useTour } from '@reactour/tour';
import { useEffect, useState } from 'react';
import { OnboardingPopover } from './OnboardingPopover';

interface UseProfileMainOnboardingProps {
  isLoading: boolean;
}

const PROFILE_MAIN_ONBOARDING_KEY = 'arbeidsflate:profile-main-onboarding-completed';

const profileMainTourSteps = [
  {
    selector: 'aside nav a[href*="profile"]',
    content: <OnboardingPopover titleKey="My profile" infoTextKey="Some info here" />,
  },
  {
    selector: '#main-content div header',
    content: <OnboardingPopover titleKey="Heeei main content" infoTextKey="Some info here" />,
  },
  {
    selector: 'aside nav',
    content: (
      <OnboardingPopover
        titleKey="Sidestruktur"
        infoTextKey="For å gi deg Enklere navigasjon og flyt. Click on any other to see more"
      />
    ),
  },
  {
    selector: 'aside nav a[href*="parties"]',
    content: <OnboardingPopover titleKey="My actors" infoTextKey="Some info here" />,
  },
  {
    selector: 'aside nav a[href*="notifications"]',
    content: <OnboardingPopover titleKey="My notifications" infoTextKey="Some info here" />,
  },
  {
    selector: 'aside nav a[href*="settings"]',
    content: <OnboardingPopover titleKey="Settings" infoTextKey="Some info here" />,
  },
];

export const useProfileMainOnboarding = ({ isLoading }: UseProfileMainOnboardingProps) => {
  const tour = useTour();
  const { setIsOpen, setCurrentStep } = tour;
  const [hasInitialized, setHasInitialized] = useState(false);
  const hasCompletedOnboarding = localStorage.getItem(PROFILE_MAIN_ONBOARDING_KEY) === 'true';
  const shouldInitializeTour = !isLoading && !hasInitialized && !hasCompletedOnboarding;

  useEffect(() => {
    if (shouldInitializeTour) {
      if ('setSteps' in tour && typeof tour.setSteps === 'function') {
        tour.setSteps(profileMainTourSteps);
      }

      setCurrentStep(0);
      setIsOpen(true);
      setHasInitialized(true);
    }
  }, [shouldInitializeTour, tour, setIsOpen, setCurrentStep]);

  useEffect(() => {
    if (!tour.isOpen && hasInitialized) {
      localStorage.setItem(PROFILE_MAIN_ONBOARDING_KEY, 'true');
      setHasInitialized(false);
    }
  }, [tour.isOpen, hasInitialized]);
};
