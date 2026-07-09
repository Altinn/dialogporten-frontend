import type { PartyFieldsFragment } from 'bff-types-generated';
import { bench, describe } from 'vitest';
import {
  buildOrgSkeleton,
  buildPersonSkeleton,
  mapOrgItemToAccount,
} from '../components/PageLayout/Accounts/accountComputations.ts';
import { generateParties } from '../mocks/data/stories/parties-extreme/parties.ts';
import { normalizeFlattenParties } from './normalizeFlattenParties.ts';
import { buildPartyGraph } from './partyGraph.ts';

/* Benchmarks the parties post-processing pipeline stage by stage, using the real production
 * functions on generated data. Run with `pnpm bench`; override the size with
 * BENCH_PARTY_COUNT=15000 for a quick pass. Mean time per iteration is the number to read.
 *
 * Iteration hygiene: normalizeFlattenParties may mutate and pre-sort its input, so it gets a fresh
 * dataset per iteration (pre-cloned, so cloning cost stays out of the measurement). buildPartyGraph
 * memoizes per array reference, so it gets a fresh `.slice()` per iteration.
 */
const PARTY_COUNT = Number(process.env.BENCH_PARTY_COUNT ?? 100_000);
const PERSON_COUNT = 300;

const t = (key: string) => key;

const rawParties = generateParties(PARTY_COUNT, PERSON_COUNT);
const payload = JSON.stringify({ parties: rawParties });

const parseParties = (): PartyFieldsFragment[] => (JSON.parse(payload) as { parties: PartyFieldsFragment[] }).parties;

const NORMALIZE_WARMUP = 1;
const NORMALIZE_ITERATIONS = 3;
const freshPool: PartyFieldsFragment[][] = [];
for (let i = 0; i < NORMALIZE_WARMUP + NORMALIZE_ITERATIONS + 1; i++) {
  freshPool.push(parseParties());
}
const takeFresh = (): PartyFieldsFragment[] => freshPool.pop() ?? parseParties();

const normalized = await normalizeFlattenParties(parseParties());
const graph = buildPartyGraph(normalized);
const otherPeople = normalized.filter(
  (party) => (party.partyType === 'Person' || party.partyType === 'SelfIdentified') && !party.isCurrentEndUser,
);
const organizations = normalized.filter((party) => party.partyType === 'Organization');
const orgSkeleton = buildOrgSkeleton(organizations, graph);

describe(`parties pipeline @ ${PARTY_COUNT} parties (${(payload.length / 1024 / 1024).toFixed(1)}MB payload)`, () => {
  bench(
    'JSON.parse of GraphQL payload',
    () => {
      parseParties();
    },
    { time: 0, iterations: 5, warmupIterations: 1, throws: true },
  );

  bench(
    'normalizeFlattenParties',
    async () => {
      normalizeFlattenParties(takeFresh());
    },
    { time: 0, iterations: NORMALIZE_ITERATIONS, warmupIterations: NORMALIZE_WARMUP, throws: true },
  );

  bench(
    'buildPartyGraph',
    () => {
      buildPartyGraph(normalized.slice());
    },
    { time: 0, iterations: 5, warmupIterations: 1, throws: true },
  );

  bench(
    'buildPersonSkeleton (sort persons)',
    () => {
      buildPersonSkeleton(otherPeople);
    },
    { time: 0, iterations: 5, warmupIterations: 1, throws: true },
  );

  bench(
    'buildOrgSkeleton (group + sort orgs)',
    () => {
      buildOrgSkeleton(organizations, graph);
    },
    { time: 0, iterations: 5, warmupIterations: 1, throws: true },
  );

  bench(
    'materialize org PartyItemProps',
    () => {
      for (const item of orgSkeleton) {
        mapOrgItemToAccount(item, { showDescription: true, t });
      }
    },
    { time: 0, iterations: 5, warmupIterations: 1, throws: true },
  );
});
