//to be updated with API data
const KEY = 'tour-step';

export const saveTourProgress = (step: number, completed = false) => {
  if (completed) {
    localStorage.removeItem(KEY);
  } else {
    localStorage.setItem(KEY, JSON.stringify({ currentStep: step, completed: false }));
  }
};

export const loadTourProgress = () => {
  const stored = localStorage.getItem(KEY);
  return stored ? JSON.parse(stored) : null;
};

export const shouldResumeTour = () => {
  const progress = loadTourProgress();
  return progress && !progress.completed;
};
