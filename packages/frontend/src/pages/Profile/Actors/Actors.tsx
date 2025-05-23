import {
  type AccountListItemType,
  type AvatarSize,
  type AvatarType,
  Button,
  type Color,
  DsParagraph,
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
import { HeartFillIcon, HeartIcon, InboxIcon, PlusIcon } from '@navikt/aksel-icons';
import type { PartyFieldsFragment } from 'bff-types-generated';
import { t } from 'i18next';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParties } from '../../../api/hooks/useParties';
import { useProfile } from '../../../profile';
import { PageRoutes } from '../../routes';
import { PartyListItem } from './ActorListItem';
import styles from './actors.module.css';

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
  const showDeletedActors = false; // TODO: Implement toolbar filter for deleted actors
  const [isPreselectedActor, setIsPreselectedActor] = useState(false);
  const { favoriteActors, profile, user, toggleFavoriteActor } = useProfile();
  const navigate = useNavigate();

  // TODO: Remove this when we have implemented the new profile API
  console.info('Got profile from Core Platform API: ', profile);
  console.info('Got user from Core Platform API: ', user);

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
  const favoriteParties = parties.filter((party) => {
    if (favoriteActors?.find((actor) => actor?.includes(party.party))) return true;
    if (party.isCurrentEndUser) return true;
    return false;
  });
  const nonFavoriteParties = parties.filter((party) => {
    if (!favoriteActors?.find((actor) => actor?.includes(party.party)) && !party.isCurrentEndUser) return true;
    return false;
  });
  const urnToOrgNr = (urn: string) => {
    const identifier = 'identifier-no:';
    const startIndex = urn.indexOf(identifier) + identifier.length;
    const orgOrPersonNumber = urn.substring(startIndex);
    if (urn.includes('person')) {
      return orgOrPersonNumber.slice(0, 6) + ' ' + orgOrPersonNumber.slice(6);
    }
    return orgOrPersonNumber?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const partyFieldFragmentToAccountListItem = (parties: PartyFieldsFragment[]) => {
    return parties.map((party) => {
      const isOrganization = party.partyType === 'Organization';
      const favourite = !!favoriteActors?.find((actor) => actor?.includes(party.party));
      return {
        id: party.party,
        type: party.partyType as AccountListItemType,
        favourite,
        title: party.name,
        label: party.isCurrentEndUser ? 'Deg' : '',
        favouriteLabel: 'Favoritt',
        collapsible: true,
        avatar: {
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
          id: party.party + '-menu',
          items: [
            {
              id: 'inbox',
              groupId: 'apps',
              icon: InboxIcon,
              title: 'Gå til Innboks',
              onClick: () => navigate(PageRoutes.inbox),
            },
            {
              id: 'fav',
              groupId: 'context',
              icon: favourite ? HeartFillIcon : HeartIcon,
              title: favourite ? 'Fjern fra favoritter' : 'Legg til favoritter',
              onClick: () => {
                console.info('Toggling favorite actor', party.party);
                toggleFavoriteActor(party.party);
              },
            },
            {
              id: 'new-group',
              groupId: 'new',
              icon: PlusIcon,
              title: 'Ny gruppe',
            },
          ],
          groups: {
            apps: {
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
                <PartyListItem key={party.id} party={party} />
              ))}
            </List>
          </>
        ) : (
          <>
            <Heading size="lg">Deg selv og favoritter</Heading>
            <List>
              {partyFieldFragmentToAccountListItem(favoriteParties).map((party) => (
                <PartyListItem key={party.id} party={party} />
              ))}
            </List>
          </>
        )}
        {nonFavoriteParties.length > 0 && !searchValue && (
          <>
            <Heading size="lg">Andre aktører</Heading>
            <List>
              {partyFieldFragmentToAccountListItem(nonFavoriteParties).map((party) => (
                <PartyListItem key={party.id} party={party} />
              ))}
            </List>
          </>
        )}
      </Section>
    </PageBase>
  );
};
