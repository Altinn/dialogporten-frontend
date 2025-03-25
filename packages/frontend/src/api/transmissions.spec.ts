import type { TransmissionFieldsFragment } from 'bff-types-generated';
import { describe, expect, it } from 'vitest';
import { groupTransmissions } from './transmissions.ts';

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
