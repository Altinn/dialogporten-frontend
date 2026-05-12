import { AttachmentUrlConsumer, type TransmissionFieldsFragment } from 'bff-types-generated';
import { describe, expect, it } from 'vitest';
import { getTransmissionVisibility, groupTransmissions } from './transmissions.ts';

describe('groupTransmissions', () => {
  const transmissions: TransmissionFieldsFragment[] = [
    {
      id: '1',
      createdAt: '2023-01-01T00:00:00Z',
      sender: 'sender1',
      content: { title: { value: 'Title 1' }, summary: { value: 'Summary 1' } },
      type: 'Type1',
    },
    {
      id: '2',
      relatedTransmissionId: '1',
      createdAt: '2023-01-02T00:00:00Z',
      sender: 'sender2',
      content: { title: { value: 'Title 2' }, summary: { value: 'Summary 2' } },
      type: 'Type2',
    },
    {
      id: '3',
      relatedTransmissionId: undefined,
      createdAt: '2023-01-03T00:00:00Z',
      content: { title: { value: 'Title 3' }, summary: { value: 'Summary 3' } },
      type: 'Type3',
    },
  ] as unknown as TransmissionFieldsFragment[];

  it('should group related transmissions together', () => {
    const result = groupTransmissions(transmissions);

    expect(result.length).toBe(2);
    expect(result[0].length).toBe(1);
    expect(result[1].length).toBe(2);
    expect(result[0].map((t) => t.id)).toEqual(['3']);
    expect(result[1].map((t) => t.id)).toEqual(['1', '2']);
  });

  it('should return an empty array when there are no transmissions', () => {
    const result = groupTransmissions([]);
    expect(result).toEqual([]);
  });

  it('should return a single group when there is only one transmission', () => {
    const singleTransmission: TransmissionFieldsFragment[] = [
      {
        id: '1',
        createdAt: '2023-01-01T00:00:00Z',
        sender: 'sender1',
        content: { title: { value: 'Title 1' }, summary: { value: 'Summary 1' } },
        type: 'Type1',
      },
    ] as unknown as TransmissionFieldsFragment[];
    const result = groupTransmissions(singleTransmission);
    expect(result.length).toBe(1);
    expect(result[0].length).toBe(1);
    expect(result[0][0].id).toBe('1');
  });

  it('should handle multiple groups of related transmissions', () => {
    const multipleGroups: TransmissionFieldsFragment[] = [
      {
        id: '1',
        createdAt: '2023-01-01T00:00:00Z',
        sender: 'sender1',
        content: { title: { value: 'Title 1' }, summary: { value: 'Summary 1' } },
        type: 'Type1',
      },
      {
        id: '2',
        relatedTransmissionId: '1',
        createdAt: '2023-01-02T00:00:00Z',
        sender: 'sender2',
        content: { title: { value: 'Title 2' }, summary: { value: 'Summary 2' } },
        type: 'Type2',
      },
      {
        id: '3',
        createdAt: '2023-01-03T00:00:00Z',
        sender: 'sender3',
        content: { title: { value: 'Title 3' }, summary: { value: 'Summary 3' } },
        type: 'Type3',
      },
      {
        id: '4',
        relatedTransmissionId: '3',
        createdAt: '2023-01-04T00:00:00Z',
        sender: 'sender4',
        content: { title: { value: 'Title 4' }, summary: { value: 'Summary 4' } },
        type: 'Type4',
      },
    ] as unknown as TransmissionFieldsFragment[];
    const result = groupTransmissions(multipleGroups);
    expect(result.length).toBe(2);
    expect(result[0].map((t) => t.id)).toEqual(['3', '4']);
    expect(result[1].map((t) => t.id)).toEqual(['1', '2']);
  });

  it('should handle circular relationships', () => {
    const circularTransmissions: TransmissionFieldsFragment[] = [
      {
        id: '1',
        relatedTransmissionId: '2',
        createdAt: '2023-01-01T00:00:00Z',
        sender: 'sender1',
        content: { title: { value: 'Title 1' }, summary: { value: 'Summary 1' } },
        type: 'Type1',
      },
      {
        id: '2',
        relatedTransmissionId: '3',
        createdAt: '2023-01-02T00:00:00Z',
        sender: 'sender2',
        content: { title: { value: 'Title 2' }, summary: { value: 'Summary 2' } },
        type: 'Type2',
      },
      {
        id: '3',
        relatedTransmissionId: '1',
        createdAt: '2023-01-03T00:00:00Z',
        sender: 'sender3',
        content: { title: { value: 'Title 3' }, summary: { value: 'Summary 3' } },
        type: 'Type3',
      },
    ] as unknown as TransmissionFieldsFragment[];
    const result = groupTransmissions(circularTransmissions);
    expect(result.length).toBe(1);
    expect(result[0].map((t) => t.id)).toEqual(['1', '2', '3']);
  });
});

const makeTransmission = (overrides: Partial<TransmissionFieldsFragment> = {}): TransmissionFieldsFragment =>
  ({
    id: 'test-id',
    createdAt: '2024-01-01T00:00:00Z',
    isAuthorized: true,
    type: 'INFORMATION',
    sender: { actorType: 'ServiceOwner', actorId: null, actorName: null },
    content: {
      title: { value: [{ value: 'Title', languageCode: 'nb' }], mediaType: 'text/plain' },
      summary: null,
      contentReference: null,
    },
    attachments: [],
    ...overrides,
  }) as unknown as TransmissionFieldsFragment;

// One test per case from issue #3819:
// isAuthorized=false + only API attachments              => A: filter out
// isAuthorized=false + has GUI attachment                => B: disable expansion
// isAuthorized=true  + only API attachments              => A: filter out
// isAuthorized=true  + visible content                   => show normally
// isAuthorized=true  + no visible content                => C: show with empty-state explanation
// isAuthorized=true  + only unauthorized GUI link        => show with disabled link
describe('getTransmissionVisibility', () => {
  it('case 1 — isAuthorized=false, API-only attachment → filtered (A)', () => {
    const t = makeTransmission({
      isAuthorized: false,
      attachments: [
        {
          id: 'a1',
          displayName: [],
          urls: [
            { id: 'u1', url: 'https://api.example.com', consumerType: AttachmentUrlConsumer.Api, mediaType: null },
          ],
        },
      ],
    });
    expect(getTransmissionVisibility(t)).toBe('filter');
  });

  it('case 2 — isAuthorized=false, GUI attachment → disabled (B)', () => {
    const t = makeTransmission({
      isAuthorized: false,
      attachments: [
        {
          id: 'a1',
          displayName: [],
          urls: [
            {
              id: 'u1',
              url: 'https://gui.example.com/file.pdf',
              consumerType: AttachmentUrlConsumer.Gui,
              mediaType: null,
            },
          ],
        },
      ],
    });
    expect(getTransmissionVisibility(t)).toBe('disabled');
  });

  it('case 3 — isAuthorized=true, API-only attachment → filtered (A)', () => {
    const t = makeTransmission({
      isAuthorized: true,
      attachments: [
        {
          id: 'a1',
          displayName: [],
          urls: [
            { id: 'u1', url: 'https://api.example.com', consumerType: AttachmentUrlConsumer.Api, mediaType: null },
          ],
        },
      ],
    });
    expect(getTransmissionVisibility(t)).toBe('filter');
  });

  it('case 3b — isAuthorized=true, API-only attachment but has summary → shown (not filtered)', () => {
    const t = makeTransmission({
      isAuthorized: true,
      content: {
        title: { value: [{ value: 'Title', languageCode: 'nb' }], mediaType: 'text/plain' },
        summary: { value: [{ value: 'A-meldingen er sendt inn.', languageCode: 'nb' }], mediaType: 'text/plain' },
        contentReference: null,
      },
      attachments: [
        {
          id: 'a1',
          displayName: [],
          urls: [
            { id: 'u1', url: 'https://api.example.com', consumerType: AttachmentUrlConsumer.Api, mediaType: null },
          ],
        },
      ],
    });
    expect(getTransmissionVisibility(t)).toBe('visible');
  });

  it('case 4 — isAuthorized=true, visible content → shown', () => {
    const t = makeTransmission({
      content: {
        title: { value: [{ value: 'Title', languageCode: 'nb' }], mediaType: 'text/plain' },
        summary: { value: [{ value: 'Synlig innhold', languageCode: 'nb' }], mediaType: 'text/plain' },
        contentReference: null,
      },
    });
    expect(getTransmissionVisibility(t)).toBe('visible');
  });

  it('case 5 — isAuthorized=true, no visible content → empty with explanation (C)', () => {
    expect(getTransmissionVisibility(makeTransmission())).toBe('empty');
  });

  it('case 6 — isAuthorized=true, unauthorized GUI link only → shown with disabled link', () => {
    const t = makeTransmission({
      attachments: [
        {
          id: 'a1',
          displayName: [],
          urls: [
            {
              id: 'u1',
              url: 'urn:dialogporten:unauthorized',
              consumerType: AttachmentUrlConsumer.Gui,
              mediaType: null,
            },
          ],
        },
      ],
    });
    expect(getTransmissionVisibility(t)).toBe('visible');
  });

  it('case 7 — isAuthorized=true, summary and GUI attachment → shown', () => {
    const t = makeTransmission({
      content: {
        title: { value: [{ value: 'Title', languageCode: 'nb' }], mediaType: 'text/plain' },
        summary: { value: [{ value: 'Tilbakemelding på a-melding', languageCode: 'nb' }], mediaType: 'text/plain' },
        contentReference: null,
      },
      attachments: [
        {
          id: 'a1',
          displayName: [{ value: 'tilbakemelding', languageCode: 'nb' }],
          urls: [
            {
              id: 'u1',
              url: 'https://gui.example.com/file.pdf',
              consumerType: AttachmentUrlConsumer.Gui,
              mediaType: 'application/json',
            },
            {
              id: 'u2',
              url: 'https://api.example.com/file',
              consumerType: AttachmentUrlConsumer.Api,
              mediaType: 'application/json',
            },
          ],
        },
      ],
    });
    expect(getTransmissionVisibility(t)).toBe('visible');
  });
});
