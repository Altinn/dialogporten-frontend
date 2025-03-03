import type { FilterState } from '@altinn/altinn-components';
import { describe, expect, it } from 'vitest';
import { isSavedSearchDisabled } from './savedSearchEnabled.ts';

describe('', () => {
  it('should be disabled when there are no keys in filter state and no enteredSearchValue', () => {
    const disabled = isSavedSearchDisabled({}, '');
    expect(disabled).toEqual(true);
  });

  it('should be enabled when there are no keys in filter state and an enteredSearchValue', () => {
    const disabled = isSavedSearchDisabled({}, 'hello');
    expect(disabled).toEqual(false);
  });

  it('should be disabled when there are no values in filter state', () => {
    const activeState: FilterState = {
      sender: [],
    };
    const disabled = isSavedSearchDisabled(activeState, '');
    expect(disabled).toEqual(true);
  });

  it('should be disabled when there are no values in filter state', () => {
    const activeState = {
      sender: undefined,
    };
    const disabled = isSavedSearchDisabled(activeState, '');
    expect(disabled).toEqual(true);
  });

  it('should not be disabled when there are multiple values in filter state', () => {
    const activeState = {
      sender: ['Digitaliseringsdirektoratet', 'digitaliseringsdirektoratet', 'Skatteetaten'],
      status: ['NEW'],
    };
    const disabled = isSavedSearchDisabled(activeState, '');
    expect(disabled).toEqual(false);
  });

  it('should not be disabled when there are values in filter state', () => {
    const activeState = {
      sender: ['Skatteetaten'],
    } as unknown as FilterState;
    const disabled = isSavedSearchDisabled(activeState, '');
    expect(disabled).toEqual(false);
  });
});
