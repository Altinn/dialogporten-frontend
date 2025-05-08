import {
  type AccountListItemType,
  type AvatarSize,
  type AvatarType,
  Button,
  type Color,
  DsDialog,
  DsParagraph,
  DsTextfield,
  Heading,
  List,
  PageBase,
  PageNav,
  Section,
  TextField,
  Toolbar,
  Typography,
} from '@altinn/altinn-components';
import { DsSwitch } from '@altinn/altinn-components';
import { HeartFillIcon, HeartIcon, InboxIcon, MinusCircleIcon, PlusCircleIcon } from '@navikt/aksel-icons';
import { useQueryClient } from '@tanstack/react-query';
import type { Group, PartyFieldsFragment } from 'bff-types-generated';
import { t } from 'i18next';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParties } from '../../../api/hooks/useParties';
import { addFavoriteActorToGroup } from '../../../api/queries';
import { QUERY_KEYS } from '../../../constants/queryKeys';
import { useProfile } from '../../../profile';
import { PageRoutes } from '../../routes';
import { ActorListItem } from './ActorListItem';
import styles from './actors.module.css';

interface PartyFields extends PartyFieldsFragment {
  dialogRef?: React.RefObject<HTMLDialogElement>;
  onCreateGroup?: (party: PartyFields) => void;
}

const urnToOrgNr = (urn: string) => {
  if (!urn) return '';
  const identifier = 'identifier-no:';
  const startIndex = urn.indexOf(identifier) + identifier.length;
  const orgOrPersonNumber = urn.substring(startIndex);
  if (urn.includes('person')) {
    return orgOrPersonNumber.slice(0, 6) + ' ' + orgOrPersonNumber.slice(6);
  }
  return orgOrPersonNumber?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const breadcrumbs = [
  {
    label: t('word.frontpage'),
    href: PageRoutes.inbox,
  },
  {
    label: t('sidebar.profile'),
    href: PageRoutes.profile,
  },
  {
    label: t('sidebar.profile.actors'),
    href: PageRoutes.actors,
  },
];

export const Actors = () => {
  const [searchValue, setSearchValue] = useState('');
  const [chosenParty, setChosenParty] = useState<PartyFieldsFragment | undefined>(undefined);
  const showDeletedActors = false; // TODO: Implement toolbar filter for deleted actors
  const [isPreselectedActor, setIsPreselectedActor] = useState(false);
  const { groups, user, addFavoriteActor, deleteFavoriteActor, favoriteActors } = useProfile();
  const navigate = useNavigate();
  const addGroupDialogRef = useRef<HTMLDialogElement | null>(null);

  const { parties: normalParties, isLoading: isLoadingParties, deletedParties } = useParties();

  const getPartiesToShow = () => {
    const partiesSource = showDeletedActors ? [...normalParties, ...deletedParties] : normalParties;
    if (searchValue) {
      return partiesSource.filter((party) => party.name.toLowerCase().includes(searchValue.toLowerCase()));
    }
    return partiesSource;
  };

  const parties = getPartiesToShow();
  if (isLoadingParties) {
    return (
      <div className={styles.noResults}>
        <Typography>Insert Skeleton here</Typography>
      </div>
    );
  }
  const nonFavoritePartyGroups = groups.filter((group) => !group!.isfavorite) || [];
  const allGroupedParties = (groups ?? [])
    .flatMap((group) => group?.parties ?? [])
    .filter((party): party is NonNullable<typeof party> => !!party);

  const nonGroupedParties = parties.filter(
    (item) => !allGroupedParties.some((groupedParty) => groupedParty.id === item.party) && !item.isCurrentEndUser,
  );

  const partyFieldFragmentToAccountListItem = (
    parties: PartyFields[],
    group?: Group,
    dialogRef?: React.RefObject<HTMLDialogElement | null>,
  ) => {
    if (!parties || parties.length === 0) {
      return [];
    }
    return parties.map((party) => {
      const isOrganization = party.partyType === 'Organization';
      const favourite =
        !!favoriteActors?.find((actor) => actor?.party?.includes(party.party)) && !party.isCurrentEndUser;
      return {
        id: party.party,
        type: party.partyType as AccountListItemType,
        favourite,
        title: party.name,
        label: party.isCurrentEndUser ? 'Deg' : '',
        favouriteLabel: 'Favoritt',
        collapsible: true,
        icon: {
          type: isOrganization ? ('company' as AvatarType) : ('person' as AvatarType),
          name: party.name,
          size: 'md' as AvatarSize,
        },
        description: `${isOrganization ? 'Org.nr. ' : 'Personnummer: '} ${urnToOrgNr(party.party)}`,
        children: (
          <Section padding={4} spacing={4}>
            <Typography>
              <div className={styles.actorInfoHeader}>{isOrganization ? 'Organisasjonsnummer' : 'Personnummer'}</div>
              <div className={styles.actorInfoValue}>{urnToOrgNr(party.party)}</div>
            </Typography>
            <div>
              <Typography>
                <h3>Kontaktinfo:</h3>
              </Typography>
              {user && (
                <DsParagraph style={{ whiteSpace: 'pre-line' }}>
                  {`${user.party?.person?.firstName} ${user.party?.person?.lastName}
                  ${user.party?.person?.addressStreetName} ${user.party?.person?.addressHouseNumber}
                  ${user.party?.person?.addressPostalCode} ${user.party?.person?.addressMunicipalName}`}
                </DsParagraph>
              )}
            </div>
            <TextField label="Epostadresse for varslinger" size="sm" type="email" value={'ola@nordmann.no'} />
            <TextField label="SMS-varslinger" size="sm" type="tel" value={'93065211'} />
            <DsSwitch
              checked={isPreselectedActor}
              label="Forhåndsvalgt aktør"
              value={'alt1'}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsPreselectedActor(e.target!.checked)}
            />
            <div className={styles.buttonContainer}>
              <Button color={isOrganization ? ('company' as Color) : ('person' as Color)}>Lagre endringer</Button>
              <Button variant="outline" color={isOrganization ? ('company' as Color) : ('person' as Color)}>
                Avbryt
              </Button>
            </div>
          </Section>
        ),
        contextMenu: {
          id: group?.name + party.party + '-menu',
          items: [
            {
              id: party.party + 'inbox',
              uniqueId: group?.name + party.party + '-inbox',
              parentId: group?.name + party.party + '-menu',
              groupId: 'inbox',
              icon: InboxIcon,
              title: 'Gå til Innboks',
              onClick: () => navigate(PageRoutes.inbox),
            },
            ...(!group?.isfavorite
              ? [
                  {
                    id: party.party + 'favadd',
                    uniqueId: group?.name + party.party + '-favadd',
                    groupId: 'context',
                    icon: HeartIcon,
                    title: 'Legg til favoritter',
                    onClick: () => {
                      addFavoriteActor(party.party);
                    },
                  },
                ]
              : []),

            ...(group?.isfavorite && favourite
              ? [
                  {
                    id: party.party + 'favrem',
                    uniqueId: group?.name + party.party + '-favrem',
                    groupId: 'context',
                    icon: HeartFillIcon,
                    title: 'Fjern fra favoritter',
                    onClick: () => {
                      group && deleteFavoriteActor(party.party, `${group?.id}`);
                    },
                  },
                ]
              : []),

            ...(!group?.isfavorite && group
              ? [
                  {
                    id: party.party + 'favremgroup',
                    uniqueId: group?.name + party.party + '-fr',
                    groupId: 'context',
                    icon: MinusCircleIcon,
                    title: 'Fjern fra "' + group?.name + '"',
                    onClick: () => {
                      group && deleteFavoriteActor(party.party, `${group?.id}`);
                    },
                  },
                ]
              : []),
            {
              id: party.party + 'new-group',

              uniqueId: group?.name + party.party + '-ng',
              groupId: 'NewGroup',

              icon: PlusCircleIcon,
              title: 'Legg til i ny gruppe',
              onClick: () => {
                dialogRef?.current?.showModal();
                setChosenParty(party);
              },
            },
          ],
          groups: {
            apps: {
              key: party.party + '-apps',
              title: party.name,
            },
          },
        },
      };
    });
  };

  return (
    <PageBase color="person">
      <PageNav breadcrumbs={breadcrumbs} />
      <Section as="header" spacing={6}>
        <Heading size="xl">Mine aktører og favoritter</Heading>
        <Toolbar
          search={{
            name: 'actor-search',
            placeholder: 'Søk etter aktør',
            value: searchValue,
            onChange: (e) => setSearchValue((e.target as HTMLInputElement).value),
            onClear: () => setSearchValue(''),
          }}
          filters={[
            {
              name: 'type',
              label: 'Alle aktører',
              optionType: 'radio',
              options: [
                {
                  groupId: '1',
                  label: 'Virksomheter',
                  value: 'company',
                },
                {
                  groupId: '1',
                  label: 'Personer',
                  value: 'person',
                },
                {
                  groupId: '1',
                  label: 'Grupper',
                  value: 'group',
                },
                {
                  groupId: '2',
                  type: 'checkbox',
                  name: 'deleted',
                  label: 'Vis slettede enheter',
                  value: 'true',
                },
              ],
            },
          ]}
        />
      </Section>

      <Section spacing={6}>
        {searchValue ? (
          <>
            <Heading size="lg">Søkeresultater:</Heading>
            <List>
              {partyFieldFragmentToAccountListItem(parties).map((party) => (
                <ActorListItem key={party.id} party={party} />
              ))}
            </List>
          </>
        ) : (
          <>
            <Heading size="lg">Deg selv og favoritter</Heading>
            <List>
              {partyFieldFragmentToAccountListItem(
                favoriteActors,
                groups.find((group) => group?.isfavorite) || undefined,
                addGroupDialogRef,
              ).map((p) => (
                <ActorListItem key={p.id} party={p} />
              ))}
            </List>
          </>
        )}

        <AddToGroupDialog dialogRef={addGroupDialogRef} chosenParty={chosenParty} />
        {nonFavoritePartyGroups.length > 0 && !searchValue && (
          <Section spacing={6}>
            {nonFavoritePartyGroups?.map((group) => {
              const currentGroupParties = parties.filter((party) => {
                if (group?.parties?.find((actor) => actor?.id!.includes(party.party))) return true;
                return false;
              });
              if (!currentGroupParties || currentGroupParties.length === 0) return null;
              return (
                <div key={group!.id}>
                  <Heading size="lg">{group?.name}</Heading>
                  <List>
                    {partyFieldFragmentToAccountListItem(currentGroupParties, group as Group, addGroupDialogRef).map(
                      (party) => (
                        <ActorListItem key={party.id} party={party} />
                      ),
                    )}
                  </List>
                </div>
              );
            })}
          </Section>
        )}
        {nonGroupedParties.length > 0 && !searchValue && (
          <Section spacing={6}>
            <Heading size="lg">Andre aktører</Heading>
            <List>
              {partyFieldFragmentToAccountListItem(nonGroupedParties, undefined, addGroupDialogRef).map((party) => (
                <ActorListItem key={party.id} party={party} />
              ))}
            </List>
          </Section>
        )}
      </Section>
    </PageBase>
  );
};

// To be removed/replaced when design is ready
const AddToGroupDialog: React.FC<{
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
          p?.party && (await addFavoriteActorToGroup(p.party, dialogRef.current?.querySelector('input')?.value || ''));
          void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE] });
          dialogRef.current?.close();
        }}
      >
        Legg til i gruppe
      </Button>
    </DsDialog>
  );
};
