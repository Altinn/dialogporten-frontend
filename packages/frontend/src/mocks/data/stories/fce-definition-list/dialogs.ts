import { DialogStatus, SystemLabel } from 'bff-types-generated';
import { type MockDialog, mockDialog } from '../../base/mockDialog.ts';

export const dialogs: MockDialog[] = [
  mockDialog({
    id: '019a5b10-2c3d-7e4f-8a9b-0c1d2e3f4a5b',
    org: 'skd',
    status: DialogStatus.Completed,
    endUserContext: { systemLabels: [SystemLabel.Default] },
    createdAt: '2026-10-06T12:09:00.000Z',
    contentUpdatedAt: '2026-10-06T12:09:00.000Z',
    content: {
      title: {
        mediaType: 'text/plain',
        value: [{ value: 'Kvittering for innsendt skjema', languageCode: 'nb' }],
      },
      summary: {
        mediaType: 'text/plain',
        value: [{ value: 'Vi har mottatt skjemaet ditt.', languageCode: 'nb' }],
      },
      senderName: null,
      extendedStatus: null,
    },
    mainContentMarkdown: `Vi har mottatt skjemaet ditt.

Dato sendt
: 06.10.2026 / 14:09

Avsender
: 029147*****-Ola Nordmann

Organisasjonsnummer
: 912 345 678

Vedlegg
: Situasjonsplan.pdf
: Fullmakt.pdf`,
  }),
];
