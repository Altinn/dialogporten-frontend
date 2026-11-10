export const collapseSlashes = (pathname: string): string => pathname.replace(/\/{2,}/g, '/');

export const normalizePathSlashes = (): void => {
  const { pathname, search, hash } = window.location;
  const normalized = collapseSlashes(pathname);
  if (normalized !== pathname) {
    window.history.replaceState(window.history.state, '', normalized + search + hash);
  }
};
