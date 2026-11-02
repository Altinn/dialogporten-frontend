import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { focusField } from './focusField.ts';

const render = (html: string) => {
  document.body.innerHTML = html;
};

const focusedPath = () => document.activeElement?.getAttribute('data-path');

describe('focusField', () => {
  beforeEach(() => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.unstubAllGlobals();
  });

  it('focuses the field with the exact path', () => {
    render('<input data-path="guiActions.0.title" /><input data-path="guiActions.0.url" />');
    focusField('guiActions.0.url');
    expect(focusedPath()).toBe('guiActions.0.url');
  });

  it('falls back to the closest field for a deeper path', () => {
    render('<input data-path="content.mainContentReference" />');
    focusField('content.mainContentReference.value.0.value');
    expect(focusedPath()).toBe('content.mainContentReference');
  });

  it('uses the first field below a path that is a whole item or list', () => {
    render('<input data-path="guiActions.0.title" /><input data-path="guiActions.1.title" />');
    focusField('guiActions');
    expect(focusedPath()).toBe('guiActions.0.title');
  });

  it('does not treat a similar path as a match', () => {
    render('<input data-path="guiActions.10.url" /><input data-path="guiActions.1.url" />');
    focusField('guiActions.1');
    expect(focusedPath()).toBe('guiActions.1.url');
  });

  it('opens every collapsed parent', () => {
    render(`
      <details id="section"><summary>Forsendelser</summary>
        <details id="item"><summary>Forsendelse 1</summary>
          <input data-path="transmissions.0.content.title" />
        </details>
      </details>
    `);
    focusField('transmissions.0.content');
    expect(document.querySelector<HTMLDetailsElement>('#section')?.open).toBe(true);
    expect(document.querySelector<HTMLDetailsElement>('#item')?.open).toBe(true);
    expect(focusedPath()).toBe('transmissions.0.content.title');
  });

  it('keeps trying until a field that was just opened can take focus', () => {
    render('<input data-path="content.title" />');
    const field = document.querySelector('input') as HTMLInputElement;
    const focus = field.focus.bind(field);
    let attempts = 0;
    field.focus = (options) => {
      attempts++;
      if (attempts === 3) {
        focus(options);
      }
    };

    focusField('content.title');

    expect(attempts).toBe(3);
    expect(focusedPath()).toBe('content.title');
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('treats the path as plain text, not as a selector', () => {
    render('<input data-path="content.title" />');
    expect(() => focusField('"], script, [x="')).not.toThrow();
    expect(focusedPath()).toBeNull();
  });

  it('does nothing when no field matches', () => {
    render('<input data-path="content.title" />');
    expect(() => focusField('party')).not.toThrow();
    expect(focusedPath()).toBeNull();
  });
});
