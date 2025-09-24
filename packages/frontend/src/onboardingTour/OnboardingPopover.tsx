import { Button, Heading, Typography } from '@altinn/altinn-components';
import { XMarkIcon } from '@navikt/aksel-icons';
import { useTour } from '@reactour/tour';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParties } from '../api/hooks/useParties';
import styles from './onboardingPopover.module.css';

interface OnboardingPopoverProps {
  titleKey: string;
  infoTextKey: string;
}

export const OnboardingPopover = ({ titleKey, infoTextKey }: OnboardingPopoverProps) => {
  const { selectedProfile } = useParties();
  const { t } = useTranslation();
  const { currentStep, steps, setCurrentStep, setIsOpen } = useTour();
  const containerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const isFirst = currentStep === 0;
  const isLast = currentStep === (steps?.length ?? 0) - 1;

  const handlePrevious = () => {
    if (!isFirst) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (!isLast) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleFinish = () => {
    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Tab') {
      const focusables = containerRef.current?.querySelectorAll('button') as NodeListOf<HTMLElement>;

      if (!focusables?.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    } else if (event.key === 'Escape') {
      handleClose();
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: This hook does not specify all of its dependencies
  useEffect(() => {
    closeButtonRef.current?.focus();

    const container = containerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
      return () => container.removeEventListener('keydown', handleKeyDown);
    }
  }, []);

  return (
    <div ref={containerRef} className={styles.container}>
      <button
        ref={closeButtonRef}
        type="button"
        className={styles.closeButton}
        onClick={handleClose}
        aria-label={t('word.close')}
      >
        <XMarkIcon className={styles.closeIcon} />
      </button>
      <Typography>
        <Heading>{t(titleKey)}</Heading>
        <p>{t(infoTextKey)}</p>
      </Typography>

      <div className={styles.controlsContainer}>
        <div>
          {!isFirst && (
            <Button variant="outline" color={selectedProfile} onClick={handlePrevious}>
              {t('onboarding.previous')}
            </Button>
          )}
        </div>
        {!isLast ? (
          <Button color={selectedProfile} onClick={handleNext}>
            {t('onboarding.next')}
          </Button>
        ) : (
          <Button color={selectedProfile} onClick={handleFinish}>
            {t('onboarding.finish')}
          </Button>
        )}
      </div>
    </div>
  );
};
