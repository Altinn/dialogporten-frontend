import { ActorType } from 'bff-types-generated';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getActorProps, getAttachmentTarget } from './useDialogById.tsx';

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

describe('getAttachmentTarget', () => {
  const stubUserAgent = (userAgent: string) =>
    vi.spyOn(globalThis.navigator, 'userAgent', 'get').mockReturnValue(userAgent);

  const FIREFOX_IOS =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/135.0 Mobile/15E148 Safari/605.1.15';
  const SAFARI_IOS =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Mobile/15E148 Safari/604.1';

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('opens HTML attachments in the same tab', () => {
    stubUserAgent(SAFARI_IOS);
    expect(getAttachmentTarget('text/html')).toBe('_self');
  });

  it('opens non-HTML attachments in a new tab', () => {
    stubUserAgent(SAFARI_IOS);
    expect(getAttachmentTarget('application/pdf')).toBe('_blank');
  });

  it('opens PDF attachments in the same tab on Firefox for iOS', () => {
    stubUserAgent(FIREFOX_IOS);
    expect(getAttachmentTarget('application/pdf')).toBe('_self');
  });

  it('opens attachments with unknown media type in the same tab on Firefox for iOS', () => {
    stubUserAgent(FIREFOX_IOS);
    expect(getAttachmentTarget(null)).toBe('_self');
  });
});
