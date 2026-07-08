import { useCallback, useEffect, useRef, useState } from 'react';
import { getCookie, setCookieWithExpiry } from '../../cookie.ts';

/** Permanent "don't show again" preference — survives across browser sessions. */
const DISMISS_COOKIE_NAME = 'AltinnOrgLimitInfoDismissed';
const DISMISS_COOKIE_VALUE = 'true';
const DISMISS_COOKIE_MAX_AGE_DAYS = 365;

/** Per-session "already shown" flag — resets when the tab/session ends, unlike the cookie above. */
const SESSION_SHOWN_KEY = 'org-limit-info:shown-this-session';

export interface UseOrgLimitInfoModalResult {
  isOpen: boolean;
  close: (dontShowAgain: boolean) => void;
}

/**
 * Opens the org-limit info modal the first time `accountNavigatorVisible` flips
 * from false to true (i.e. the AccountNavigator's pagination becomes necessary),
 * unless the user has permanently dismissed it (cookie) or already seen it once
 * in this browser session (sessionStorage). Does not reopen on subsequent
 * visible-to-visible re-renders, or if the user navigates away and back within
 * the same session.
 */
export const useOrgLimitInfoModal = (accountNavigatorVisible: boolean): UseOrgLimitInfoModalResult => {
  const [isOpen, setIsOpen] = useState(false);
  const wasVisibleRef = useRef(false);

  useEffect(() => {
    const justBecameVisible = accountNavigatorVisible && !wasVisibleRef.current;
    wasVisibleRef.current = accountNavigatorVisible;

    if (!justBecameVisible) return;

    const permanentlyDismissed = getCookie(DISMISS_COOKIE_NAME) === DISMISS_COOKIE_VALUE;
    const shownThisSession =
      typeof window !== 'undefined' && window.sessionStorage.getItem(SESSION_SHOWN_KEY) === 'true';

    if (permanentlyDismissed || shownThisSession) return;

    setIsOpen(true);
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(SESSION_SHOWN_KEY, 'true');
    }
  }, [accountNavigatorVisible]);

  const close = useCallback((dontShowAgain: boolean) => {
    setIsOpen(false);
    if (dontShowAgain) {
      setCookieWithExpiry(DISMISS_COOKIE_NAME, DISMISS_COOKIE_VALUE, DISMISS_COOKIE_MAX_AGE_DAYS);
    }
  }, []);

  return { isOpen, close };
};
