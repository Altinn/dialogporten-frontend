import { useTour } from '@reactour/tour';
import { useEffect } from 'react';
import { saveTourProgress } from './persistence';

export const useTourPersistence = () => {
  const { currentStep, isOpen, steps } = useTour();

  useEffect(() => {
    if (currentStep === undefined || steps.length === 0) return;

    if (isOpen) {
      saveTourProgress(currentStep, false);
    } else if (currentStep >= steps.length - 1) {
      saveTourProgress(currentStep, true);
    }
  }, [currentStep, isOpen, steps.length]);
};
