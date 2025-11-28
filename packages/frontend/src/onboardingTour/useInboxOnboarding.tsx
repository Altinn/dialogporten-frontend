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
    selector: 'aside nav > ul > li:nth-child(1)',
    content: (
      <OnboardingPopover titleKey="onboarding.tour.inbox.title" infoTextKey="onboarding.tour.inbox.description" />
    ),
  },
  {
    selector: 'aside nav a[href*="drafts"]',
    content: <OnboardingPopover titleKey="component.drafts" infoTextKey="onboarding.tour.drafts.description" />,
  },
  {
    selector: 'aside nav a[href*="sent"]',
    content: <OnboardingPopover titleKey="component.sent" infoTextKey="onboarding.tour.sent.description" />,
  },
  {
    selector: 'aside nav > ul > li:nth-child(2)',
    content: (
      <OnboardingPopover
        titleKey="onboarding.tour.shortcuts.title"
        infoTextKey="onboarding.tour.shortcuts.description"
      />
    ),
    highlightedSelectors: [
      'aside nav > ul > li:nth-child(2)',
      'aside nav > ul > li:nth-child(3)',
      'aside nav > ul > li:nth-child(4)',
    ],
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

const INBOX_ONBOARDING_KEY = 'arbeidsflate:inbox-onboarding-displayed';

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

  const searchParams = new URLSearchParams(window.location.search);
  const isMock = searchParams.get('mock') === 'true';

  const hasCompletedOnboarding = localStorage.getItem(INBOX_ONBOARDING_KEY) === 'true';
  const shouldInitializeTour =
    !isMock &&
    !isLoadingParties &&
    !isLoadingDialogs &&
    dialogsSuccess &&
    viewType === 'inbox' &&
    !hasInitialized &&
    (!hasCompletedOnboarding || globalTour);

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
      localStorage.setItem(INBOX_ONBOARDING_KEY, 'true');
      setGlobalTour(false);
      setHasInitialized(false);
    }
  }, [tour.isOpen, hasInitialized, setGlobalTour]);
};
