/* Use this hook to simulate errors in dev mode for Playwright tests. */
export const useMockError = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const isMock = searchParams.get('mock') === 'true';
  const simulateError = searchParams.get('simulateError') === 'true';
  if (isMock && simulateError) {
    throw new Error('Simulated error for testing purposes');
  }
};
