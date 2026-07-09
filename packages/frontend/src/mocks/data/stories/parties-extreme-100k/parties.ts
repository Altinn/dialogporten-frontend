import type { PartyFieldsFragment } from 'bff-types-generated';
import { generateParties } from '../parties-extreme/parties.ts';

export const parties: PartyFieldsFragment[] = generateParties(100_000, 300);
