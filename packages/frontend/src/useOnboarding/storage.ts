//TODO - Local Storege to delete after storing/fetching from user data.

const ONBOARDING_KEY = 'onboarding_completed';

export const isOnboardingCompleted = (): boolean => {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === 'true';
  } catch (error) {
    console.warn('Failed to read onboarding status from localStorage:', error);
    return false;
  }
};

export const markOnboardingCompleted = (): void => {
  try {
    localStorage.setItem(ONBOARDING_KEY, 'true');
  } catch (error) {
    console.warn('Failed to save onboarding status to localStorage:', error);
  }
};

export const resetOnboarding = (): void => {
  try {
    localStorage.removeItem(ONBOARDING_KEY);
  } catch (error) {
    console.warn('Failed to reset onboarding status in localStorage:', error);
  }
};
