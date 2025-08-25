import { Button, Heading, Typography } from '@altinn/altinn-components';
import { useTour } from '@reactour/tour';

interface OnboardingPopoverProps {
  title: string;
  infoText: string;
}

export const OnboardingPopover = ({ title, infoText }: OnboardingPopoverProps) => {
  const { currentStep, steps, setCurrentStep, setIsOpen } = useTour();

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

  return (
    <div style={{ padding: '16px' }}>
      {/* <Heading>{title}</Heading>
      <Typography>{infoText}</Typography> */}

      <Typography>
        <Heading>{title}</Heading>
        <p>{infoText}</p>
      </Typography>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <div>{!isFirst && <Button onClick={handlePrevious}>Previous</Button>}</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {!isLast ? <Button onClick={handleNext}>Next</Button> : <Button onClick={handleFinish}>Finish</Button>}
        </div>
      </div>
    </div>
  );
};
