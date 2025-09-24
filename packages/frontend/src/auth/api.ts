export const getIsAuthenticated = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/isAuthenticated', {
      credentials: 'include',
      cache: 'no-store',
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};
