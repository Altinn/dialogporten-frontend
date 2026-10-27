import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ANALYTICS_EVENTS } from '../../analytics/analyticsEvents.ts';
import { TransmissionNavigationalActions } from './TransmissionNavigationalActions.tsx';

const { trackEvent, flush } = vi.hoisted(() => ({ trackEvent: vi.fn(), flush: vi.fn() }));

vi.mock('../../analytics/analytics.ts', () => ({ Analytics: { trackEvent, flush } }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const preventNavigation = (event: Event) => event.preventDefault();

describe('TransmissionNavigationalActions telemetry', () => {
  beforeEach(() => {
    document.addEventListener('click', preventNavigation);
    render(
      <TransmissionNavigationalActions
        items={[
          { id: 'available', label: 'Gå til kvittering', href: 'https://example.com/kvittering' },
          { id: 'expired', label: 'Fyll ut skjema', href: 'urn:dialogporten:expired', disabledReason: 'expired' },
        ]}
      />,
    );
  });

  afterEach(() => {
    document.removeEventListener('click', preventNavigation);
    vi.clearAllMocks();
  });

  it('tracks and flushes when an available action is clicked', () => {
    fireEvent.click(screen.getByRole('link', { name: 'Gå til kvittering' }));

    expect(trackEvent).toHaveBeenCalledWith(ANALYTICS_EVENTS.DIALOG_TRANSMISSION_NAVIGATIONAL_ACTION_CLICK, {
      'action.title': 'Gå til kvittering',
      'navigationalActions.totalCount': 2,
    });
    expect(flush).toHaveBeenCalledAfter(trackEvent);
  });

  it('does not track a disabled action', () => {
    fireEvent.click(screen.getByRole('button', { name: 'Fyll ut skjema' }));

    expect(trackEvent).not.toHaveBeenCalled();
    expect(flush).not.toHaveBeenCalled();
  });
});
