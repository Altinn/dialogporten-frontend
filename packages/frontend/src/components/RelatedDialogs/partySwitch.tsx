import { useCallback } from 'react';
import { Link, type LinkProps, useLocation } from 'react-router';
import { useParties } from '../../api/hooks/useParties.ts';
import { useSelectedPartyIds } from '../../api/hooks/usePartiesSelectors.ts';
import { FixedGlobalQueryParams } from '../../pages/Inbox/queryParams.ts';
import type { PartyGraph } from '../../utils/partyGraph.ts';

export interface PartySwitchTarget {
  /** Query string (without '?') for the link to the related dialog */
  search: string;
  /** Set when the target party is a person, which is selected in state rather than through the URL */
  personParty?: string;
}

/**
 * Works out how to link to a related dialog so that its own party becomes the selected party, instead of carrying
 * over the current party selection (a child dialog usually belongs to another party than its parent, e.g. a subunit).
 *
 * Organizations are selected through the `party` query param, like the account menu does, so the link also works when
 * opened in a new tab. Persons are kept out of the URL by design, so for them the party params are stripped and the
 * person must be selected on click. If the party is not one of the user's parties, the current selection is kept.
 */
export const getPartySwitchTarget = (
  party: string,
  currentSearch: string,
  partyGraph: PartyGraph,
): PartySwitchTarget => {
  const target = partyGraph.partyByUrn.get(party);
  if (!target) {
    return { search: currentSearch.replace(/^\?/, '') };
  }

  const params = new URLSearchParams(currentSearch);
  params.delete(FixedGlobalQueryParams.party);
  params.delete(FixedGlobalQueryParams.allParties);
  params.delete(FixedGlobalQueryParams.group);
  params.delete(FixedGlobalQueryParams.subAccounts);

  if (target.partyType === 'Organization') {
    params.set(FixedGlobalQueryParams.party, target.party);
    return { search: params.toString() };
  }

  return { search: params.toString(), personParty: target.party };
};

export const getRelatedDialogHref = (dialogId: string, search: string): string =>
  `/inbox/${dialogId}/${search ? `?${search}` : ''}`;

/**
 * Where the dialog page's back link returns to after following a related dialog link. As the link switches party, a
 * plain `fromView + location.search` would come back to the previous dialog with the related dialog's party selected.
 */
export interface RelatedDialogReturnTo {
  href: string;
  /** The person to reselect on return, as persons are not part of the URL */
  personParty?: string;
  /** The previous dialog's own location state, so that its back link still leads to where it was opened from */
  state?: unknown;
}

export interface RelatedDialogLocationState {
  fromView?: string;
  returnTo?: RelatedDialogReturnTo;
}

const hasPartySelectionParams = (search: string): boolean => {
  const params = new URLSearchParams(search);
  return [FixedGlobalQueryParams.party, FixedGlobalQueryParams.allParties, FixedGlobalQueryParams.group].some((key) =>
    params.has(key),
  );
};

export const getRelatedDialogReturnTo = (
  pathname: string,
  search: string,
  selectedPartyIds: string[],
  state?: unknown,
): RelatedDialogReturnTo => {
  const personParty =
    !hasPartySelectionParams(search) && selectedPartyIds.length === 1 && selectedPartyIds[0].includes(':person:')
      ? selectedPartyIds[0]
      : undefined;
  return { href: pathname + search, personParty, state };
};

/**
 * Link for related dialogs. Unlike DialogListItemLink it does not append the current query string, as the href
 * already carries the party switch. It keeps the view the current dialog was opened from (for the menu and
 * breadcrumbs) and records the current dialog, with its party selection, as the back link target.
 */
export const RelatedDialogLink = ({ href = '', ...props }: Omit<LinkProps, 'to'> & { href?: string }) => {
  const location = useLocation();
  const selectedPartyIds = useSelectedPartyIds();
  const state: RelatedDialogLocationState = {
    fromView: (location.state as RelatedDialogLocationState | null)?.fromView,
    returnTo: getRelatedDialogReturnTo(location.pathname, location.search, selectedPartyIds, location.state),
  };
  return <Link state={state} {...props} to={href} />;
};

/**
 * Returns a function resolving the href (and, for persons, a click handler) for a link to a related dialog owned by
 * the given party.
 */
export const useRelatedDialogLinkTarget = (partyGraph: PartyGraph) => {
  const location = useLocation();
  const { setSelectedPartyIds } = useParties();

  return useCallback(
    (dialogId: string, party: string): { href: string; onClick?: () => void } => {
      const { search, personParty } = getPartySwitchTarget(party, location.search, partyGraph);
      return {
        href: getRelatedDialogHref(dialogId, search),
        onClick: personParty ? () => setSelectedPartyIds([personParty], null) : undefined,
      };
    },
    [location.search, partyGraph, setSelectedPartyIds],
  );
};
