import { ActorType } from 'bff-types-generated';

export const PERSON_PARTY = 'urn:altinn:person:identifier-no:1';
export const BAKERY_PARTY = 'urn:altinn:organization:identifier-no:313507648';

export const kari = {
  actorType: ActorType.PartyRepresentative,
  actorId: 'urn:altinn:person:identifier-ephemeral:5e1a9c2b7d',
  actorName: 'HANSEN KARI',
};

export const martin = {
  actorType: ActorType.PartyRepresentative,
  actorId: 'urn:altinn:person:identifier-ephemeral:8b3f4e6a1c',
  actorName: 'HAUGEN MARTIN',
};

export const payrollSystem = {
  actorType: ActorType.PartyRepresentative,
  actorId: 'urn:altinn:systemuser:uuid:6f2d8a41-93c7-4b0e-a5d2-1c7e9f3b8a60',
  actorName: 'Lønnssystem',
};

export const serviceOwner = {
  actorType: ActorType.ServiceOwner,
  actorId: null,
  actorName: null,
};

export const DIALOG_IDS = {
  sickPay: '0199c6a2-41f0-7d3e-8a5b-3f2e1d000001',
  foodInspection: '0199c6a2-41f0-7d3e-8a5b-3f2e1d000002',
  statistics: '0199c6a2-41f0-7d3e-8a5b-3f2e1d000003',
  outdoorSeating: '0199c6a2-41f0-7d3e-8a5b-3f2e1d000004',
  aMelding: '0199c6a2-41f0-7d3e-8a5b-3f2e1d000005',
  vehicle: '0199c6a2-41f0-7d3e-8a5b-3f2e1d000006',
  servingLicence: '0199c6a2-41f0-7d3e-8a5b-3f2e1d000007',
  vatRegistration: '0199c6a2-41f0-7d3e-8a5b-3f2e1d000008',
  companyRegistration: '0199c6a2-41f0-7d3e-8a5b-3f2e1d000009',
};

const DAY_MS = 24 * 60 * 60 * 1000;

export const daysAgo = (days: number, hours = 9, minutes = 0): string => {
  const date = new Date(Date.now() - days * DAY_MS);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
};

export const daysAhead = (days: number): string => daysAgo(-days, 23, 59);

const longDate = new Intl.DateTimeFormat('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' });
const monthName = new Intl.DateTimeFormat('nb-NO', { month: 'long' });

export const formatDate = (iso: string): string => longDate.format(new Date(iso));

export const previousMonth = (iso: string): { name: string; year: number } => {
  const date = new Date(iso);
  const previous = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  return { name: monthName.format(previous), year: previous.getFullYear() };
};

export const previousQuarter = (): { quarter: number; year: number } => {
  const now = new Date();
  const current = Math.floor(now.getMonth() / 3) + 1;
  return current === 1
    ? { quarter: 4, year: now.getFullYear() - 1 }
    : { quarter: current - 1, year: now.getFullYear() };
};

export const nb = (value: string) => [{ value, languageCode: 'nb' }];

export const plainText = (value: string) => ({ mediaType: 'text/plain', value: nb(value) });

export const TIMELINE = {
  sickPay: {
    sickLeaveFrom: daysAgo(13),
    sickLeaveTo: daysAhead(8),
    sickNote: daysAgo(12, 10, 4),
    application: daysAgo(2, 14, 30),
    request: daysAgo(1, 8, 12),
    due: daysAhead(13),
  },
  foodInspection: {
    registration: daysAgo(58, 11, 20),
    confirmation: daysAgo(56, 9, 2),
    inspection: daysAgo(4, 10, 0),
    report: daysAgo(3, 13, 47),
    due: daysAhead(18),
  },
  statistics: {
    request: daysAgo(6, 7, 30),
    due: daysAhead(10),
  },
  outdoorSeating: {
    submitted: daysAgo(9, 14, 2),
    receipt: daysAgo(9, 14, 5),
  },
  aMelding: {
    submitted: daysAgo(15, 9, 41),
    feedback: daysAgo(15, 9, 42),
  },
  vehicle: {
    request: daysAgo(24, 15, 10),
    confirmed: daysAgo(24, 16, 2),
    registered: daysAgo(22, 10, 31),
  },
  servingLicence: {
    submitted: daysAgo(57, 10, 12),
    receipt: daysAgo(57, 10, 14),
    policeStatement: daysAgo(50, 14, 0),
    request: daysAgo(49, 9, 30),
    documentation: daysAgo(47, 20, 15),
    taxStatement: daysAgo(42, 11, 0),
    decision: daysAgo(35, 12, 0),
  },
  vatRegistration: {
    received: daysAgo(66, 12, 40),
    request: daysAgo(60, 10, 5),
    documentation: daysAgo(58, 19, 44),
    decision: daysAgo(46, 9, 15),
  },
  companyRegistration: {
    submitted: daysAgo(72, 8, 55),
    missingSignature: daysAgo(70, 13, 10),
    corrected: daysAgo(69, 18, 2),
    registered: daysAgo(66, 12, 31),
  },
};
