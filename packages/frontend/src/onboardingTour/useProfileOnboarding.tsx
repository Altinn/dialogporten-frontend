import { useTour } from '@reactour/tour';
import { useEffect, useState } from 'react';
import { useWindowSize } from '../components/PageLayout/useWindowSize';
import { QUERY_KEYS } from '../constants/queryKeys';
import { useGlobalState } from '../useGlobalState';
import { OnboardingPopover } from './OnboardingPopover';

interface UseProfileOnboardingProps {
  isLoading: boolean;
  pageType: 'main' | 'parties';
}

const STORAGE_KEYS = {
  main: 'arbeidsflate:profile-main-onboarding-completed',
  parties: 'arbeidsflate:profile-parties-onboarding-completed',
};

// Desktop tour steps
const getDesktopTourSteps = () => ({
  main: [
    {
      selector: 'aside nav',
      content: (
        <OnboardingPopover
          titleKey="onboarding.tour.profile.main.navigation.title"
          infoTextKey="onboarding.tour.profile.main.navigation.description"
        />
      ),
    },
    {
      selector: '#main-content div',
      content: (
        <OnboardingPopover
          titleKey="onboarding.tour.profile.main.dashboard.title"
          infoTextKey="onboarding.tour.profile.main.dashboard.description"
        />
      ),
    },
  ],
  parties: [
    {
      selector: 'aside nav a[href*="parties"]',
      content: (
        <OnboardingPopover
          titleKey="onboarding.tour.profile.parties.control.title"
          infoTextKey="onboarding.tour.profile.parties.control.description"
        />
      ),
    },
    {
      selector: '#main-content header input[name="party-search"]',
      content: (
        <OnboardingPopover
          titleKey="onboarding.tour.profile.parties.filter.title"
          infoTextKey="onboarding.tour.profile.parties.filter.description"
        />
      ),
      highlightedSelectors: ['#main-content header div[class*="_toolbar_"]'],
    },
    {
      selector: '#main-content ul li[data-index="1"]',
      content: (
        <OnboardingPopover
          titleKey="onboarding.tour.profile.parties.administration.title"
          infoTextKey="onboarding.tour.profile.parties.administration.description"
        />
      ),
      action: () => {
        const firstDiv = document.querySelector('#main-content header section ul li div[data-interactive="true"]');
        if (firstDiv && firstDiv.getAttribute('data-selected') !== 'true') {
          const button = firstDiv.querySelector('button');
          if (button instanceof HTMLElement) {
            button.click();
          }
        }
      },
      mutationObservables: ['#main-content'],
      resizeObservables: ['#main-content'],
    },
  ],
});

// Mobile and tablet tour steps
const getMobileTourSteps = () => ({
  main: [
    {
      selector: '#main-content div',
      content: (
        <OnboardingPopover
          titleKey="onboarding.tour.profile.main.dashboard.title"
          infoTextKey="onboarding.tour.profile.main.dashboard.description"
        />
      ),
    },
  ],
  parties: [
    {
      selector: '#main-content header input[name="party-search"]',
      content: (
        <OnboardingPopover
          titleKey="onboarding.tour.profile.parties.filter.title"
          infoTextKey="onboarding.tour.profile.parties.filter.description"
        />
      ),
      highlightedSelectors: ['#main-content header div[class*="_toolbar_"]'],
    },
    {
      selector: '#main-content ul li[data-index="1"]',
      content: (
        <OnboardingPopover
          titleKey="onboarding.tour.profile.parties.administration.title"
          infoTextKey="onboarding.tour.profile.parties.administration.description"
        />
      ),
      action: () => {
        const firstDiv = document.querySelector('#main-content header section ul li div[data-interactive="true"]');
        if (firstDiv && firstDiv.getAttribute('data-selected') !== 'true') {
          const button = firstDiv.querySelector('button');
          if (button instanceof HTMLElement) {
            button.click();
          }
        }
      },
      mutationObservables: ['#main-content'],
      resizeObservables: ['#main-content'],
    },
  ],
});

export const useProfileOnboarding = ({ isLoading, pageType }: UseProfileOnboardingProps) => {
  const tour = useTour();
  const { setIsOpen, setCurrentStep } = tour;
  const [hasInitialized, setHasInitialized] = useState(false);
  const [showProfileTour, setShowProfileTour] = useGlobalState<boolean>(QUERY_KEYS.SHOW_PROFILE_TOUR, false);
  const windowSize = useWindowSize();
  const searchParams = new URLSearchParams(window.location.search);
  const isMock = searchParams.get('mock') === 'true';

  const storageKey = STORAGE_KEYS[pageType];

  const hasCompletedOnboarding = localStorage.getItem(storageKey) === 'true';
  const shouldInitializeTour = !isMock && !isLoading && !hasInitialized && (!hasCompletedOnboarding || showProfileTour);

  useEffect(() => {
    if (shouldInitializeTour) {
      const tourSteps = windowSize.isTabletOrSmaller ? getMobileTourSteps() : getDesktopTourSteps();
      const steps = tourSteps[pageType];

      if ('setSteps' in tour && typeof tour.setSteps === 'function') {
        tour.setSteps(steps);
      }

      setCurrentStep(0);
      setIsOpen(true);
      setHasInitialized(true);
    }
  }, [shouldInitializeTour, pageType, tour, setIsOpen, setCurrentStep, windowSize.isTabletOrSmaller]);

  useEffect(() => {
    if (!tour.isOpen && hasInitialized) {
      localStorage.setItem(storageKey, 'true');
      setShowProfileTour(false);
      setHasInitialized(false);
    }
  }, [tour.isOpen, hasInitialized, storageKey, setShowProfileTour]);
};
