import { ActorType, type PartyFieldsFragment } from 'bff-types-generated';
import { describe, expect, it } from 'vitest';
import type { Locale } from '../../i18n/useDateFnsLocale.tsx';
import { toDialogById } from '../../mocks/data/base/helper.ts';
import { type MockDialogInput, mockAttachment, mockDialog } from '../../mocks/data/base/mockDialog.ts';
import { getActorProps, mapDialogToInboxItem } from './useDialogById.tsx';

const mkSenderName = (nb: string) => [{ languageCode: 'nb', value: nb }];
const serviceOwner = { name: 'Skatteetaten', logo: 'https://altinncdn.no/orgs/skd/skd.png' };

describe('getActorProps', () => {
  describe('ServiceOwner actor', () => {
    const actor = { actorType: ActorType.ServiceOwner, actorId: null, actorName: null };

    it('uses senderName as display name when provided', () => {
      const result = getActorProps(actor, false, serviceOwner, mkSenderName('Namsmannen'));
      expect(result.name).toBe('Namsmannen');
    });

    it('falls back to serviceOwner.name when senderName is not provided', () => {
      const result = getActorProps(actor, false, serviceOwner);
      expect(result.name).toBe('Skatteetaten');
    });

    it('shows logo when senderName matches serviceOwner name', () => {
      const result = getActorProps(actor, false, serviceOwner, mkSenderName('Skatteetaten'));
      expect(result.imageUrl).toBe(serviceOwner.logo);
    });

    it('hides logo when senderName differs from serviceOwner name (proxy)', () => {
      const result = getActorProps(actor, false, serviceOwner, mkSenderName('Namsmannen'));
      expect(result.imageUrl).toBeUndefined();
    });

    it('returns type company', () => {
      const result = getActorProps(actor, false, serviceOwner);
      expect(result.type).toBe('company');
    });

    it('returns empty name when neither senderName nor serviceOwner is provided', () => {
      const result = getActorProps(actor, false);
      expect(result.name).toBe('');
    });
  });

  describe('SystemUser actor', () => {
    const actor = {
      actorType: ActorType.PartyRepresentative,
      actorId: 'urn:altinn:systemuser:abc123',
      actorName: 'Tripletex',
    };

    it('returns type system', () => {
      const result = getActorProps(actor, false);
      expect(result.type).toBe('system');
    });

    it('uses actorName as display name', () => {
      const result = getActorProps(actor, false);
      expect(result.name).toBe('Tripletex');
    });

    it('never shows logo', () => {
      const result = getActorProps(actor, false, serviceOwner);
      expect(result.imageUrl).toBeUndefined();
    });
  });

  describe('Organization actor', () => {
    const actor = {
      actorType: ActorType.PartyRepresentative,
      actorId: 'urn:altinn:organization:991825827',
      actorName: 'Deloitte AS',
    };

    it('returns type company', () => {
      const result = getActorProps(actor, false);
      expect(result.type).toBe('company');
    });

    it('uses actorName as display name', () => {
      const result = getActorProps(actor, false);
      expect(result.name).toBe('Deloitte AS');
    });

    it('never shows serviceOwner logo', () => {
      const result = getActorProps(actor, false, serviceOwner);
      expect(result.imageUrl).toBeUndefined();
    });
  });

  describe('Person actor', () => {
    const actor = {
      actorType: ActorType.PartyRepresentative,
      actorId: 'urn:altinn:person:12345678901',
      actorName: 'Nordmann Ola',
    };

    it('returns type person', () => {
      const result = getActorProps(actor, false);
      expect(result.type).toBe('person');
    });

    it('reverses name order by default', () => {
      const result = getActorProps(actor, false);
      expect(result.name).toBe('Ola Nordmann');
    });

    it('does not reverse name when stopReversingPersonNameOrder is true', () => {
      const result = getActorProps(actor, true);
      expect(result.name).toBe('Nordmann Ola');
    });

    it('never shows logo', () => {
      const result = getActorProps(actor, false, serviceOwner);
      expect(result.imageUrl).toBeUndefined();
    });
  });
});

describe('mapDialogToInboxItem', () => {
  const company = 'urn:altinn:organization:identifier-no:1';
  const person = 'urn:altinn:person:identifier-no:1';
  const parties = [
    { party: company, partyType: 'Organization', name: 'Firma AS', isCurrentEndUser: false },
    { party: person, partyType: 'Person', name: 'Test Testesen', isCurrentEndUser: true },
  ] as unknown as PartyFieldsFragment[];
  const excluded = (count: number) =>
    Array.from({ length: count }, (_, index) => ({ id: `x${index}`, createdAt: '2026-11-01T00:00:00Z' }));

  const map = (overrides: Partial<MockDialogInput>) =>
    mapDialogToInboxItem({
      item: toDialogById(
        mockDialog({
          id: 'dialog',
          content: {
            title: { mediaType: 'text/plain', value: [{ value: 'Tittel', languageCode: 'nb' }] },
            summary: null,
            senderName: null,
            extendedStatus: null,
          },
          ...overrides,
        }),
      ),
      parties,
      organizations: [],
      format: (date) => String(date),
      stopReversingPersonNameOrder: true,
      selectedProfile: 'neutral',
      locale: {} as Locale,
    })!;

  const hiddenHint = 'Avsender har skjult disse fordi du ikke har tilgang.';

  it.each([
    ['an organisation', company],
    ['a person', person],
  ])('counts hidden GUI actions and says why, also for %s', (_case, party) => {
    const { excludedGuiActions } = map({ party, excludedGuiActions: excluded(2) });
    expect(excludedGuiActions).toEqual({
      hiddenItemsLabel: '+ 2 handlinger du ikke har tilgang til.',
      hiddenItemsTooltip: hiddenHint,
    });
  });

  it('leaves out the plus when every GUI action is hidden', () => {
    const { excludedGuiActions } = map({ party: company, guiActions: [], excludedGuiActions: excluded(1) });
    expect(excludedGuiActions.hiddenItemsLabel).toBe('1 handling du ikke har tilgang til.');
  });

  it('says nothing about hidden GUI actions when none are excluded', () => {
    expect(map({ party: company }).excludedGuiActions).toEqual({});
  });

  it('gives the dialog attachments the same hidden label', () => {
    const { attachments } = map({ party: company, attachments: [], excludedAttachments: excluded(3) });
    expect(attachments).toEqual({
      title: 'Ingen vedlegg',
      items: [],
      hiddenItemsLabel: '3 vedlegg du ikke har tilgang til å se.',
      hiddenItemsTooltip: hiddenHint,
    });
  });

  it('adds a plus to the hidden attachments when some are visible', () => {
    const { attachments } = map({
      party: company,
      attachments: [mockAttachment('dialog')],
      excludedAttachments: excluded(3),
    });
    expect(attachments.hiddenItemsLabel).toBe('+ 3 vedlegg du ikke har tilgang til å se.');
  });
});
