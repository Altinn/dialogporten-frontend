import { useTour } from '@reactour/tour';
import { useEffect, useState } from 'react';
import { OnboardingPopover } from './OnboardingPopover';

interface UseProfileSettingsOnboardingProps {
  isLoading: boolean;
}

const PROFILE_SETTINGS_ONBOARDING_KEY = 'arbeidsflate:profile-settings-onboarding-completed';

const profileSettingsTourSteps = [
  {
    selector: 'aside nav a[href*="settings"]',
    content: <OnboardingPopover titleKey="Settings title" infoTextKey="lorem ipsum" />,
  },
];

export const useProfileSettingsOnboarding = ({ isLoading }: UseProfileSettingsOnboardingProps) => {
  const tour = useTour();
  const { setIsOpen, setCurrentStep } = tour;
  const [hasInitialized, setHasInitialized] = useState(false);
  const hasCompletedOnboarding = localStorage.getItem(PROFILE_SETTINGS_ONBOARDING_KEY) === 'true';
  const shouldInitializeTour = !isLoading && !hasInitialized && !hasCompletedOnboarding;

  useEffect(() => {
    if (shouldInitializeTour) {
      if ('setSteps' in tour && typeof tour.setSteps === 'function') {
        tour.setSteps(profileSettingsTourSteps);
      }

      setCurrentStep(0);
      setIsOpen(true);
      setHasInitialized(true);
    }
  }, [shouldInitializeTour, tour, setIsOpen, setCurrentStep]);

  useEffect(() => {
    if (!tour.isOpen && hasInitialized) {
      localStorage.setItem(PROFILE_SETTINGS_ONBOARDING_KEY, 'true');
      setHasInitialized(false);
    }
  }, [tour.isOpen, hasInitialized]);
};
