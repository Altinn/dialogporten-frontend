import type { PartyFieldsFragment, SubPartyFieldsFragment } from 'bff-types-generated';

/**
 * Reproduces the "blank inbox under 'Alle virksomheter'" bug where the
 * subunit filter shows a count *within* the 100-limit (here: 99 units),
 * yet the dialog query is silently disabled.
 *
 * Why it happens:
 *   - The visible count (`filteredSubAccounts` in useSubAccounts) excludes
 *     deleted units when shouldShowDeletedEntities is false (see profile.ts).
 *   - But getPartyIds() rebuilds the party list from each parent's
 *     `.subParties` array WITHOUT an isDeleted filter, so the deleted
 *     sub-units are re-added to the URNs actually sent to the API.
 *
 * Result with this dataset:
 *   - Subunit filter label:  1 parent + 98 active sub-units      = "99 enheter"
 *   - getPartyIds() sends:    99 + 4 deleted sub-units            = 103 URNs
 *   - 103 > MAX_DIALOG_PARTY_SIZE (100) -> isQueryEnabled = false
 *     -> isLimitReached -> DialogList renders no items AND no
 *        "Ingen treff" title/description.
 *   - AccountNavigator stays hidden because it is keyed off the same
 *     under-counted 99 (< 100), so the user has no pagination escape hatch.
 *
 * Manual testing:
 *   /?mock=true&playwrightId=parties-over-100-with-deleted-subunits
 *   - Select "Alle virksomheter" -> blank inbox (the bug).
 *   - Select a single active sub-unit from the sub-unit menu (e.g.
 *     "STORSELSKAP AVD 001") -> its dialog appears, proving data exists.
 */
const ACTIVE_SUBUNIT_COUNT = 98;
const DELETED_SUBUNIT_COUNT = 4;

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
