import { ActorType } from 'bff-types-generated';
import { describe, expect, it } from 'vitest';
import { getActorProps } from './useDialogById.tsx';

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
