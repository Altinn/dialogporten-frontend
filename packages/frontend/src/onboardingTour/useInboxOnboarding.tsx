import { useTour } from '@reactour/tour';
import { useEffect, useState } from 'react';
import { useWindowSize } from '../components/PageLayout/useWindowSize';
import { QUERY_KEYS } from '../constants/queryKeys';
import { useGlobalState } from '../useGlobalState';
import { OnboardingPopover } from './OnboardingPopover';

interface UseInboxOnboardingProps {
  isLoadingParties: boolean;
  isLoadingDialogs: boolean;
  dialogsSuccess: boolean;
  dialog: { id: string } | null;
  viewType: string;
}

//for static elements - desktop
export const desktopTourSteps = [
  {
    selector: '[data-testid="searchbar-input"]',
    content: (
      <OnboardingPopover titleKey="onboarding.tour.search.title" infoTextKey="onboarding.tour.search.description" />
    ),
  },
  {
    selector: '[data-testid="inbox-toolbar"]',
    content: (
      <OnboardingPopover titleKey="onboarding.tour.filter.title" infoTextKey="onboarding.tour.filter.description" />
    ),
  },
  {
    selector: 'aside nav',
    content: (
      <OnboardingPopover titleKey="onboarding.tour.inbox.title" infoTextKey="onboarding.tour.inbox.description" />
    ),
  },
];

//for static elements - mobile and tablet
export const mobileTourSteps = [
  {
    selector: '[data-testid="searchbar-input"]',
    content: (
      <OnboardingPopover titleKey="onboarding.tour.search.title" infoTextKey="onboarding.tour.search.description" />
    ),
  },
  {
    selector: '[data-testid="inbox-toolbar"]',
    content: (
      <OnboardingPopover titleKey="onboarding.tour.filter.title" infoTextKey="onboarding.tour.filter.description" />
    ),
  },
];

export const useInboxOnboarding = ({
  isLoadingParties,
  isLoadingDialogs,
  dialogsSuccess,
  dialog,
  viewType,
}: UseInboxOnboardingProps) => {
  const [globalTour, setGlobalTour] = useGlobalState<boolean>(QUERY_KEYS.SHOW_TOUR, false);
  const windowSize = useWindowSize();
  const tour = useTour();
  const { setIsOpen, setCurrentStep } = tour;
  const [hasInitialized, setHasInitialized] = useState(false);
  const shouldInitializeTour =
    globalTour && !isLoadingParties && !isLoadingDialogs && dialogsSuccess && viewType === 'inbox' && !hasInitialized;

  useEffect(() => {
    if (shouldInitializeTour) {
      //for dynamic elements/interactions etc
      const baseTourSteps = windowSize.isTabletOrSmaller ? mobileTourSteps : desktopTourSteps;
      const dynamicSteps = [...baseTourSteps];

      if (dialog) {
        const escapedId = CSS.escape(dialog.id);
        dynamicSteps.push({
          selector: `#${escapedId}`,
          content: (
            <OnboardingPopover
              titleKey="onboarding.tour.messages.title"
              infoTextKey="onboarding.tour.messages.description"
            />
          ),
        });

        dynamicSteps.push({
          selector: `#${escapedId} button[aria-label*="menu"], #${escapedId} button[aria-label*="meny"]`,
          content: (
            <OnboardingPopover
              titleKey="onboarding.tour.menu_options.title"
              infoTextKey="onboarding.tour.menu_options.description"
            />
          ),
        });
      }

      if ('setSteps' in tour && typeof tour.setSteps === 'function') {
        tour.setSteps(dynamicSteps);
      }

      setCurrentStep(0);
      setIsOpen(true);

      setHasInitialized(true);
    }
  }, [shouldInitializeTour, dialog, tour, setIsOpen, setCurrentStep, windowSize.isTabletOrSmaller]);

  useEffect(() => {
    if (!tour.isOpen && hasInitialized) {
      setGlobalTour(false);
      setHasInitialized(false);
    }
  }, [tour.isOpen, hasInitialized, setGlobalTour]);
};
