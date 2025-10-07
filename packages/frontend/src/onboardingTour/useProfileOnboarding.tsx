import { useTour } from '@reactour/tour';
import { useEffect, useState } from 'react';
import { OnboardingPopover } from './OnboardingPopover';

interface UseProfileOnboardingProps {
  isLoading: boolean;
  pageType: 'main' | 'parties' | 'notifications' | 'settings';
}

const STORAGE_KEYS = {
  main: 'arbeidsflate:profile-main-onboarding-completed',
  parties: 'arbeidsflate:profile-parties-onboarding-completed',
  notifications: 'arbeidsflate:profile-notifications-onboarding-completed',
  settings: 'arbeidsflate:profile-settings-onboarding-completed',
};

const TOUR_STEPS = {
  main: [
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
  ],
  parties: [
    {
      selector: 'aside nav a[href*="parties"]',
      content: <OnboardingPopover titleKey="test title" infoTextKey="test description" />,
    },
  ],
  notifications: [
    {
      selector: 'aside nav',
      content: <OnboardingPopover titleKey="Test title" infoTextKey="Some info here" />,
    },
  ],
  settings: [
    {
      selector: 'aside nav a[href*="settings"]',
      content: <OnboardingPopover titleKey="Settings title" infoTextKey="lorem ipsum" />,
    },
  ],
};

export const useProfileOnboarding = ({ isLoading, pageType }: UseProfileOnboardingProps) => {
  const tour = useTour();
  const { setIsOpen, setCurrentStep } = tour;
  const [hasInitialized, setHasInitialized] = useState(false);

  const storageKey = STORAGE_KEYS[pageType];

  const hasCompletedOnboarding = localStorage.getItem(storageKey) === 'true';
  const shouldInitializeTour = !isLoading && !hasInitialized && !hasCompletedOnboarding;

  useEffect(() => {
    if (shouldInitializeTour) {
      const steps = TOUR_STEPS[pageType];

      if ('setSteps' in tour && typeof tour.setSteps === 'function') {
        tour.setSteps(steps);
      }

      setCurrentStep(0);
      setIsOpen(true);
      setHasInitialized(true);
    }
  }, [shouldInitializeTour, pageType, tour, setIsOpen, setCurrentStep]);

  useEffect(() => {
    if (!tour.isOpen && hasInitialized) {
      localStorage.setItem(storageKey, 'true');
      setHasInitialized(false);
    }
  }, [tour.isOpen, hasInitialized, storageKey]);
};
