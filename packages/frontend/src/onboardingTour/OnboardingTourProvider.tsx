import { TourProvider } from '@reactour/tour';
import type { ReactNode } from 'react';

interface OnboardingTourProviderProps {
  children: ReactNode;
}

export const OnboardingTourProvider = ({ children }: OnboardingTourProviderProps) => {
  return (
    <TourProvider
      steps={[]}
      defaultOpen={false}
      disableInteraction
      showNavigation={false}
      showPrevNextButtons={false}
      showCloseButton={false}
      showDots={false}
      onClickMask={({ setIsOpen }) => setIsOpen(false)}
      afterOpen={() => {
        document.body.style.overflow = 'hidden';
      }}
      beforeClose={() => {
        document.body.style.overflow = 'unset';
      }}
    >
      {children}
    </TourProvider>
  );
};
