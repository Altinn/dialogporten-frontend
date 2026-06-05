import { describe, expect, it } from 'vitest';
import {
  MAX_DIALOG_PARTY_SIZE,
  MAX_SERVICE_RESOURCE_SIZE,
  isDialogCountInconclusive,
  isDialogQueryEnabled,
} from './useDialogs.tsx';

const createPartyIds = (count: number): string[] => Array.from({ length: count }, (_, i) => `urn:altinn:party:${i}`);
const createServiceResources = (count: number): string[] =>
  Array.from({ length: count }, (_, i) => `urn:altinn:resource:service-${i}`);

describe('isDialogQueryEnabled', () => {
  it('should be enabled when partyIds and queryPartyURIs are within limit', () => {
    const partyIds = createPartyIds(5);
    expect(isDialogQueryEnabled({ queryPartyURIs: partyIds, serviceResources: [] })).toBe(true);
  });

  it('should be disabled when partyIds is empty', () => {
    expect(isDialogQueryEnabled({ queryPartyURIs: [], serviceResources: [] })).toBe(false);
  });

  it('should be enabled when partyIds length equals MAX_DIALOG_PARTY_SIZE', () => {
    const partyIds = createPartyIds(MAX_DIALOG_PARTY_SIZE);
    expect(isDialogQueryEnabled({ queryPartyURIs: partyIds, serviceResources: [] })).toBe(true);
  });

  it('should be disabled when partyIds exceed MAX_DIALOG_PARTY_SIZE', () => {
    const partyIds = createPartyIds(MAX_DIALOG_PARTY_SIZE + 1);
    expect(isDialogQueryEnabled({ queryPartyURIs: partyIds, serviceResources: [] })).toBe(false);
  });

  it('should be disabled when queryPartyURIs exceed limit and serviceResources are present', () => {
    const queryPartyURIs = createPartyIds(MAX_DIALOG_PARTY_SIZE + 1);
    expect(isDialogQueryEnabled({ queryPartyURIs, serviceResources: ['urn:altinn:resource:some-service'] })).toBe(
      false,
    );
  });

  it('should be enabled with empty queryPartyURIs when serviceResources are provided', () => {
    expect(
      isDialogQueryEnabled({
        queryPartyURIs: [],
        serviceResources: ['urn:altinn:resource:some-service'],
      }),
    ).toBe(true);
  });

  it('should be enabled when serviceResources length equals MAX_SERVICE_RESOURCE_SIZE', () => {
    const serviceResources = createServiceResources(MAX_SERVICE_RESOURCE_SIZE);
    expect(isDialogQueryEnabled({ queryPartyURIs: createPartyIds(5), serviceResources })).toBe(true);
  });

  it('should be disabled when serviceResources exceed MAX_SERVICE_RESOURCE_SIZE', () => {
    const serviceResources = createServiceResources(MAX_SERVICE_RESOURCE_SIZE + 1);
    expect(isDialogQueryEnabled({ queryPartyURIs: createPartyIds(5), serviceResources })).toBe(false);
  });

  it('should be disabled when serviceResources exceed limit even with empty queryPartyURIs', () => {
    const serviceResources = createServiceResources(MAX_SERVICE_RESOURCE_SIZE + 1);
    expect(isDialogQueryEnabled({ queryPartyURIs: [], serviceResources })).toBe(false);
  });
});

describe('isDialogCountInconclusive', () => {
  it('should be false when partyIds are under limit and no next page', () => {
    const partyIds = createPartyIds(5);
    expect(isDialogCountInconclusive({ partyIds, hasNextPage: false, itemsIsNull: false })).toBe(false);
  });

  it('should be true when partyIds equal MAX_DIALOG_PARTY_SIZE', () => {
    const partyIds = createPartyIds(MAX_DIALOG_PARTY_SIZE);
    expect(isDialogCountInconclusive({ partyIds, hasNextPage: false, itemsIsNull: false })).toBe(true);
  });

  it('should be true when partyIds exceed MAX_DIALOG_PARTY_SIZE', () => {
    const partyIds = createPartyIds(MAX_DIALOG_PARTY_SIZE + 1);
    expect(isDialogCountInconclusive({ partyIds, hasNextPage: false, itemsIsNull: false })).toBe(true);
  });

  it('should be true when hasNextPage is true regardless of partyIds count', () => {
    const partyIds = createPartyIds(5);
    expect(isDialogCountInconclusive({ partyIds, hasNextPage: true, itemsIsNull: false })).toBe(true);
  });

  it('should be true when items is null regardless of partyIds count', () => {
    const partyIds = createPartyIds(5);
    expect(isDialogCountInconclusive({ partyIds, hasNextPage: false, itemsIsNull: true })).toBe(true);
  });
});
