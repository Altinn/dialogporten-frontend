import { Button, DsDialog, DsTextfield } from '@altinn/altinn-components';
import { useQueryClient } from '@tanstack/react-query';
import type { PartyFieldsFragment } from 'bff-types-generated';
import { addFavoritePartyToGroup } from '../../../api/queries';
import { QUERY_KEYS } from '../../../constants/queryKeys';

export const AddToGroupDialog: React.FC<{
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  chosenParty?: PartyFieldsFragment;
}> = ({ dialogRef, chosenParty }) => {
  const queryClient = useQueryClient();
  const p = chosenParty;
  return (
    <DsDialog ref={dialogRef}>
      <DsTextfield counter={0} description="Skriv inn gruppenavn" error="" label="" />
      <Button onClick={() => dialogRef.current?.close()}>Lukk</Button>{' '}
      <Button
        onClick={async () => {
          p?.party &&
            (await addFavoritePartyToGroup(p.party, dialogRef.current?.querySelector('input')?.value || '').then(
              (res) => console.info('Response from addFavoritePartyToGroup:', res),
            ));
          console.info('Party added to group');
          void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE] });
          dialogRef.current?.close();
        }}
      >
        Legg til i gruppe
      </Button>
    </DsDialog>
  );
};
