import type { PartyFieldsFragment, SubPartyFieldsFragment } from 'bff-types-generated';

/**
 * Reproduces the "blank inbox when selecting a single parent" variant, where the
 * problem flips depending on the "show deleted entities" setting.
 *
 * "STORSELSKAP AS" has 80 active + 40 deleted sub-units (120 total). Select the
 * parent directly (NOT "Alle virksomheter").
 *
 * With shouldShowDeletedEntities = false (see profile.ts):
 *   - Visible sub-unit list / AccountNavigator count = parent + 80 active = 81 (< 100)
 *     -> AccountNavigator hidden.
 *   - getPartyIds() (before the fix) = parent + 80 + 40 deleted = 121 (> 100)
 *     -> query disabled -> blank inbox, and no navigator to escape with.
 *   After the fix, getPartyIds() also drops deleted sub-units -> 81 -> query runs.
 *
 * With shouldShowDeletedEntities = true:
 *   - Both counts include the deleted units = 121 (> 100)
 *     -> query genuinely over the limit AND AccountNavigator shown (paginate out).
 *
 * This is why, before the fix, the navigator only appeared when "show deleted" was on:
 * the navigator is keyed off the deleted-filtered visible count, while the query limit
 * counted the deleted units regardless.
 *
 * Manual testing:
 *   /?mock=true&playwrightId=party-parent-with-deleted-subunits
 *   - Account menu -> select "STORSELSKAP AS".
 */
const ACTIVE_SUBUNIT_COUNT = 80;
const DELETED_SUBUNIT_COUNT = 40;

const pad = (n: number) => n.toString().padStart(3, '0');

const generateSubUnits = (): SubPartyFieldsFragment[] => {
  const active = Array.from({ length: ACTIVE_SUBUNIT_COUNT }, (_, i) => {
    const num = i + 1;
    return {
      party: `urn:altinn:organization:identifier-sub:${num}`,
      partyType: 'Organization',
      name: `STORSELSKAP AVD ${pad(num)}`,
      isCurrentEndUser: false,
      isDeleted: false,
      partyUuid: `urn:altinn:organization:uuid:storselskap-sub-${pad(num)}`,
      partyId: 2000 + num,
    } satisfies SubPartyFieldsFragment;
  });

  const deleted = Array.from({ length: DELETED_SUBUNIT_COUNT }, (_, i) => {
    const num = i + 1;
    return {
      party: `urn:altinn:organization:identifier-sub-deleted:${num}`,
      partyType: 'Organization',
      name: `STORSELSKAP NEDLAGT AVD ${pad(num)}`,
      isCurrentEndUser: false,
      isDeleted: true,
      partyUuid: `urn:altinn:organization:uuid:storselskap-sub-deleted-${pad(num)}`,
      partyId: 2900 + num,
    } satisfies SubPartyFieldsFragment;
  });

  return [...active, ...deleted];
};

export const parties: PartyFieldsFragment[] = [
  {
    party: 'urn:altinn:person:identifier-no:1',
    partyType: 'Person',
    subParties: [],
    name: 'STORTEST PERSON',
    isCurrentEndUser: true,
    isDeleted: false,
    partyUuid: 'urn:altinn:person:uuid:stortest-person',
    partyId: 1,
    hasOnlyAccessToSubParties: false,
  },
  {
    party: 'urn:altinn:organization:identifier-no:1',
    partyType: 'Organization',
    subParties: generateSubUnits(),
    name: 'STORSELSKAP AS',
    isCurrentEndUser: false,
    isDeleted: false,
    partyUuid: 'urn:altinn:organization:uuid:storselskap-as',
    partyId: 1000,
    hasOnlyAccessToSubParties: false,
  },
];
