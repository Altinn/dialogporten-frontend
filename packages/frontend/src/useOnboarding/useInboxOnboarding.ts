import { type Driver, driver } from 'driver.js';
import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { isOnboardingCompleted, markOnboardingCompleted, resetOnboarding as resetStorage } from './storage';

const ONBOARDING_STEPS = [
  {
    element: '#inbox-toolbar',
    titleKey: 'onboarding.toolbar.title',
    descriptionKey: 'onboarding.toolbar.description',
  },
  {
    element: '#dialog-list',
    titleKey: 'onboarding.dialogs.title',
    descriptionKey: 'onboarding.dialogs.description',
  },
];

export const useInboxOnboarding = () => {
  const { t } = useTranslation();
  const driverInstance = useRef<Driver | null>(null);
  const isInitialized = useRef(false);

  const destroyInstance = useCallback(() => {
    if (driverInstance.current) {
      driverInstance.current.destroy();
      driverInstance.current = null;
    }
    isInitialized.current = false;
  }, []);

  const handleCompletion = useCallback(() => {
    markOnboardingCompleted();
    destroyInstance();
  }, [destroyInstance]);

  const createTour = useCallback(() => {
    if (driverInstance.current || isInitialized.current) {
      return driverInstance.current;
    }

    isInitialized.current = true;

    const steps = ONBOARDING_STEPS.map((step) => ({
      element: step.element,
      popover: {
        title: t(step.titleKey),
        description: t(step.descriptionKey),
        side: 'bottom' as const,
        align: 'center' as const,
      },
    }));

    driverInstance.current = driver({
      animate: true,
      progressText: `{{current}} of {{total}}`, //TODO - translation, show progress?
      showProgress: true,
      overlayColor: 'black',
      smoothScroll: true,
      allowClose: false,
      allowKeyboardControl: true,
      doneBtnText: t('onboarding.done'),
      steps,
      showButtons: ['next', 'previous', 'close'],

      onDestroyStarted: handleCompletion,
      onCloseClick: destroyInstance,
    });

    return driverInstance.current;
  }, [t, handleCompletion, destroyInstance]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: This hook does not specify all of its dependencies
  useEffect(() => {
    if (isOnboardingCompleted() || isInitialized.current) return;

    const timer = setTimeout(() => {
      const tour = createTour();
      if (tour) {
        tour.drive();
      }
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const resetOnboarding = useCallback(() => {
    resetStorage();
    destroyInstance();
  }, [destroyInstance]);

  return { resetOnboarding };
};
