import { useCallback, useEffect, useState } from 'react';

const PARTY_LIMIT_INFO_DISMISSED_KEY = 'party-limit-info:dismissed';

let promptedAccountSelectionKey: string | null = null;

export interface UsePartyLimitInfoModalOutput {
  isOpen: boolean;
  close: (dontShowAgain: boolean) => void;
}

export const usePartyLimitInfoModal = (
  accountNavigatorVisible: boolean,
  accountSelectionKey: string,
): UsePartyLimitInfoModalOutput => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!accountNavigatorVisible) {
      if (promptedAccountSelectionKey !== accountSelectionKey) {
        promptedAccountSelectionKey = null;
      }
      return;
    }

    if (promptedAccountSelectionKey === accountSelectionKey) return;
    promptedAccountSelectionKey = accountSelectionKey;

    if (window.localStorage.getItem(PARTY_LIMIT_INFO_DISMISSED_KEY) !== 'true') {
      setIsOpen(true);
    }
  }, [accountNavigatorVisible, accountSelectionKey]);

  const close = useCallback((dontShowAgain: boolean) => {
    setIsOpen(false);
    if (dontShowAgain) {
      window.localStorage.setItem(PARTY_LIMIT_INFO_DISMISSED_KEY, 'true');
    }
  }, []);

  return { isOpen, close };
};
