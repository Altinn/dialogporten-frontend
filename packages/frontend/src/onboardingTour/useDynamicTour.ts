import { useTour } from '@reactour/tour';
import { useEffect, useState } from 'react';
import { loadTourProgress, shouldResumeTour } from './persistence';

interface UseDynamicTourProps {
  isLoadingParties: boolean;
  isLoadingDialogs: boolean;
  dialogsSuccess: boolean;
  dialog: { id: string } | null;
  viewType: string;
}

//for static elements
export const tourSteps = [
  {
    selector: '[data-testid="inbox-toolbar"]',
    content: 'This is the inbox toolbar where you can filter and search through your dialogs.',
  },
  {
    selector: '[data-testid="searchbar-input"]',
    content: 'Use this searchbar to find specific dialogs by typing keywords.',
  },
];

export const useDynamicTour = ({
  isLoadingParties,
  isLoadingDialogs,
  dialogsSuccess,
  dialog,
  viewType,
}: UseDynamicTourProps) => {
  const tour = useTour();
  const { setIsOpen, setCurrentStep } = tour;
  const [hasInitialized, setHasInitialized] = useState(false);

  const shouldInitializeTour =
    !isLoadingParties && !isLoadingDialogs && dialogsSuccess && viewType === 'inbox' && !hasInitialized;

  useEffect(() => {
    if (shouldInitializeTour) {
      //for dynamic elements/interactions etc
      const dynamicSteps = [...tourSteps];

      if (dialog) {
        const escapedId = CSS.escape(dialog.id);
        dynamicSteps.push({
          selector: `#${escapedId}`,
          content: 'This is your first dialog. Click on it to view details and interact with the dialog content.',
        });

        dynamicSteps.push({
          selector: `#${escapedId} button[aria-label*="Kontekstmeny"]`,
          content: 'Click on this context menu button to see additional actions you can perform on this dialog.',
        });
      }

      if ('setSteps' in tour && typeof tour.setSteps === 'function') {
        tour.setSteps(dynamicSteps);
      }

      if (shouldResumeTour()) {
        const progress = loadTourProgress();
        if (progress && progress.currentStep < dynamicSteps.length) {
          setCurrentStep(progress.currentStep);
          setIsOpen(true);
        }
      } else {
        setCurrentStep(0);
        setIsOpen(true);
      }

      setHasInitialized(true);
    }
  }, [shouldInitializeTour, dialog, tour, setIsOpen, setCurrentStep]);
};
