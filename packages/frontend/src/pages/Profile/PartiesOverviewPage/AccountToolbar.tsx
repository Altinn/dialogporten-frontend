import { type AccountListItemProps, Button, Flex } from '@altinn/altinn-components';
import { HeartFillIcon, HeartIcon, InboxIcon } from '@navikt/aksel-icons';
import { PageRoutes } from '../../routes';

export interface AccountToolbarProps extends AccountListItemProps {
  id: string;
  isCurrentEndUser: boolean;
  favourite?: boolean;
  onToggleFavourite?: (id: string) => void;
}

export const AccountToolbar = ({ id, isCurrentEndUser, favourite, onToggleFavourite }: AccountToolbarProps) => {
  const getInboxUrl = () => {
    const { origin } = window.location;
    const url = new URL(origin + PageRoutes.inbox);

    url.searchParams.append('party', String(id));
    return url.toString();
  };

  return (
    <Flex spacing={2} size="xs">
      {!isCurrentEndUser && (
        <Button
          variant={favourite ? 'tinted' : 'outline'}
          icon={favourite ? HeartFillIcon : HeartIcon}
          onClick={() => onToggleFavourite?.(id)}
        >
          {favourite ? 'Fjern favoritt' : 'Legg til favoritt'}
        </Button>
      )}
      <Button icon={InboxIcon} variant="outline" href={getInboxUrl()} as="a">
        Gå til Innboks
      </Button>
    </Flex>
  );
};
