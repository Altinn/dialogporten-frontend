import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DialogStatus } from 'bff-types-generated';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ANALYTICS_EVENTS } from '../../analytics/analyticsEvents.ts';
import type { DialogByIdDetails } from '../../api/hooks/useDialogById.tsx';
import { DialogDetails } from './DialogDetails.tsx';

const { calls } = vi.hoisted(() => ({ calls: [] as string[] }));

vi.mock('../../analytics/analytics.ts', () => ({
  Analytics: {
    trackEvent: (name: string) => {
      calls.push(name);
    },
    flush: () => {
      calls.push(`flush${window.location.hash}`);
    },
    trackFetchDependency: vi.fn(),
  },
}));

interface ActionItem {
  id: string;
  label: string;
  as?: string;
  href?: string;
  onClick?: () => void;
}

vi.mock('@altinn/altinn-components', () => ({
  Button: ({ children, onClick }: { children?: ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
  DialogActions: ({ items }: { items: ActionItem[] }) => (
    <>
      {items.map((item) =>
        item.as === 'a' ? (
          <a key={item.id} href={item.href} onClick={item.onClick}>
            {item.label}
          </a>
        ) : (
          <button key={item.id} type="button" onClick={item.onClick}>
            {item.label}
          </button>
        ),
      )}
    </>
  ),
  DialogAttachments: () => null,
  DialogBody: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  DialogHeader: () => null,
  DsAlert: () => null,
  DsParagraph: () => null,
  Heading: () => null,
  SnackbarDuration: { normal: 3000 },
  Timeline: () => null,
  TimelineSegment: () => null,
  TransmissionList: () => null,
  Typography: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  useSnackbar: () => ({ openSnackbar: vi.fn() }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../../hooks/useErrorLogger', () => ({
  useErrorLogger: () => ({ logError: vi.fn() }),
}));

vi.mock('../../i18n/useDateFnsLocale.tsx', () => ({
  useFormat: () => (date: Date | string) => String(date),
}));

vi.mock('../ActivityLog/ActivityLogModal.tsx', () => ({ ActivityLogModal: () => null }));
vi.mock('../AdditionalInfoContent/AdditionalInfoContent.tsx', () => ({ AdditionalInfoContent: () => null }));
vi.mock('../MainContentReference/MainContentReference.tsx', () => ({ MainContentReference: () => null }));
vi.mock('../SeenByModal/SeenByModal.tsx', () => ({ SeenByModal: () => null }));
vi.mock('./DialogHelp.tsx', () => ({ DialogHelp: () => null }));

const renderDialog = (guiActions: DialogByIdDetails['guiActions']) =>
  render(
    <DialogDetails
      dialog={
        {
          id: 'dialog-id',
          title: 'Title',
          summary: 'Summary',
          sender: { name: 'Sender' },
          receiver: { name: 'Receiver' },
          updatedAt: '2026-01-01T00:00:00Z',
          status: DialogStatus.InProgress,
          guiActions,
          attachments: [],
          transmissions: [],
          activityHistory: [],
          contentReferenceForTransmissions: {},
        } as unknown as DialogByIdDetails
      }
      activityModalProps={{ isOpen: false, setIsOpen: vi.fn() }}
      seenByLogModalProps={{ isOpen: false, setIsOpen: vi.fn() }}
      onAccessInfoClick={vi.fn()}
      dialogToken="dialog-token"
      onMessageEvent={vi.fn()}
    />,
  );

const preventNavigation = (event: Event) => event.preventDefault();

describe('DialogDetails GUI action telemetry', () => {
  beforeEach(() => {
    document.addEventListener('click', preventNavigation);
  });

  afterEach(() => {
    document.removeEventListener('click', preventNavigation);
    vi.restoreAllMocks();
    calls.length = 0;
    window.location.hash = '';
  });

  it('flushes telemetry when a GET action link is clicked', () => {
    renderDialog([
      { id: 'open', title: 'Open', url: 'https://example.com/open', httpMethod: 'GET', priority: 'Primary' },
    ]);

    fireEvent.click(screen.getByRole('link', { name: 'Open' }));

    expect(calls).toEqual([ANALYTICS_EVENTS.GUI_ACTION_CLICK, ANALYTICS_EVENTS.GUI_ACTION_SUCCESS, 'flush']);
  });

  it('flushes telemetry before navigating to a confirmed GET action', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderDialog([
      {
        id: 'confirm',
        title: 'Confirm',
        url: '#gui-action',
        httpMethod: 'GET',
        prompt: 'Are you sure?',
        priority: 'Primary',
      },
    ]);

    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(window.location.hash).toBe('#gui-action'));
    expect(calls).toEqual([ANALYTICS_EVENTS.GUI_ACTION_CLICK, ANALYTICS_EVENTS.GUI_ACTION_SUCCESS, 'flush']);
  });
});
