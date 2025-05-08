import { AccountListItem, type AccountListItemProps } from '@altinn/altinn-components';
import { useState } from 'react';

interface ActorListItemProps {
  party: AccountListItemProps;
  forceExpand?: boolean;
  isFavorite?: boolean;
}

export const ActorListItem = ({ party }: ActorListItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <AccountListItem {...party} as="button" expanded={isExpanded} onClick={() => setIsExpanded((prev) => !prev)}>
      {party.children}
    </AccountListItem>
  );
};
