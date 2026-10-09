import type { PartyFieldsFragment } from 'bff-types-generated';
import { generateParties } from '../parties-extreme/parties.ts';

export const parties: PartyFieldsFragment[] = generateParties(30_000, 300, 3);
