import { DialogStatus, SystemLabel } from 'bff-types-generated';
import type { SearchDialogFieldsFragment } from 'bff-types-generated';

export const dialogs: SearchDialogFieldsFragment[] = [
  // Dialogs for current end user
  {
    id: '01939be3-f112-75fe-a039-458acc1612bd',
    party: 'urn:altinn:person:identifier-no:12907499179',
    org: 'dmf',
    serviceResource: 'default',
    serviceResourceType: 'correspondenceservice',
    status: DialogStatus.RequiresAttention,
    createdAt: '2024-01-15T10:00:00Z',
    contentUpdatedAt: '2024-01-15T10:00:00Z',
    content: {
      title: {
        mediaType: 'text/plain',
        value: [
          { value: 'Personlig melding', languageCode: 'nb' },
          { value: 'Personal message', languageCode: 'en' },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [
          { value: 'Dette er en personlig melding til deg', languageCode: 'nb' },
          { value: 'This is a personal message to you', languageCode: 'en' },
        ],
      },
      senderName: null,
      extendedStatus: null,
    },
    endUserContext: {
      systemLabels: [SystemLabel.Default],
    },
    seenSinceLastContentUpdate: [],
    progress: null,
    hasUnopenedContent: true,
    fromServiceOwnerTransmissionsCount: 1,
    fromPartyTransmissionsCount: 0,
    guiAttachmentCount: 0,
  },
  // Dialogs for active organizations
  {
    id: '01939be3-7990-73a5-9d74-2c73da20944d',
    party: 'urn:altinn:organization:identifier-no:213294342',
    org: 'dmf',
    serviceResource: 'default',
    serviceResourceType: 'correspondenceservice',
    status: DialogStatus.InProgress,
    createdAt: '2024-02-10T12:00:00Z',
    contentUpdatedAt: '2024-02-10T12:00:00Z',
    content: {
      title: {
        mediaType: 'text/plain',
        value: [
          { value: 'Årsrapport må leveres', languageCode: 'nb' },
          { value: 'Annual report must be submitted', languageCode: 'en' },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [
          { value: 'Leveringsfrist for årsrapport er 31. mars', languageCode: 'nb' },
          { value: 'Deadline for annual report is March 31', languageCode: 'en' },
        ],
      },
      senderName: null,
      extendedStatus: null,
    },
    endUserContext: {
      systemLabels: [SystemLabel.Default],
    },
    seenSinceLastContentUpdate: [],
    progress: 50,
    hasUnopenedContent: false,
    fromServiceOwnerTransmissionsCount: 2,
    fromPartyTransmissionsCount: 1,
    guiAttachmentCount: 1,
  },
  {
    id: '01939be3-131e-739d-ad97-119614c6d3c6',
    party: 'urn:altinn:organization:identifier-no:313549461',
    org: 'skatteetaten',
    serviceResource: 'default',
    serviceResourceType: 'correspondenceservice',
    status: DialogStatus.RequiresAttention,
    createdAt: '2024-03-05T09:30:00Z',
    contentUpdatedAt: '2024-03-05T09:30:00Z',
    content: {
      title: {
        mediaType: 'text/plain',
        value: [
          { value: 'Skattekrav for 2023', languageCode: 'nb' },
          { value: 'Tax claim for 2023', languageCode: 'en' },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [
          { value: 'Du må gjennomgå og bekrefte skatteoppgjøret', languageCode: 'nb' },
          { value: 'You must review and confirm the tax settlement', languageCode: 'en' },
        ],
      },
      senderName: null,
      extendedStatus: null,
    },
    endUserContext: {
      systemLabels: [SystemLabel.Default],
    },
    seenSinceLastContentUpdate: [],
    progress: null,
    hasUnopenedContent: true,
    fromServiceOwnerTransmissionsCount: 1,
    fromPartyTransmissionsCount: 0,
    guiAttachmentCount: 2,
  },
  {
    id: '01939be2-817c-7426-9ad7-1d598c6caf16',
    party: 'urn:altinn:organization:identifier-no:313776816',
    org: 'brreg',
    serviceResource: 'default',
    serviceResourceType: 'correspondenceservice',
    status: DialogStatus.Completed,
    createdAt: '2024-01-20T14:15:00Z',
    contentUpdatedAt: '2024-01-25T16:20:00Z',
    content: {
      title: {
        mediaType: 'text/plain',
        value: [
          { value: 'Registrering bekreftet', languageCode: 'nb' },
          { value: 'Registration confirmed', languageCode: 'en' },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [
          { value: 'Din virksomhet er nå registrert i Enhetsregisteret', languageCode: 'nb' },
          { value: 'Your business is now registered in the Entity Registry', languageCode: 'en' },
        ],
      },
      senderName: null,
      extendedStatus: null,
    },
    endUserContext: {
      systemLabels: [SystemLabel.Default],
    },
    seenSinceLastContentUpdate: [],
    progress: 100,
    hasUnopenedContent: false,
    fromServiceOwnerTransmissionsCount: 1,
    fromPartyTransmissionsCount: 0,
    guiAttachmentCount: 1,
  },
  {
    id: '01939be2-1b72-744e-a972-978f88f7829a',
    party: 'urn:altinn:organization:identifier-no:312409216',
    org: 'nav',
    serviceResource: 'default',
    serviceResourceType: 'correspondenceservice',
    status: DialogStatus.RequiresAttention,
    createdAt: '2024-02-28T11:45:00Z',
    contentUpdatedAt: '2024-02-28T11:45:00Z',
    content: {
      title: {
        mediaType: 'text/plain',
        value: [
          { value: 'Arbeidsgiveravgift for Q4 2023', languageCode: 'nb' },
          { value: 'Employer tax for Q4 2023', languageCode: 'en' },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [
          { value: 'Vennligst se over og bekreft arbeidsgiveravgift', languageCode: 'nb' },
          { value: 'Please review and confirm employer tax', languageCode: 'en' },
        ],
      },
      senderName: null,
      extendedStatus: null,
    },
    endUserContext: {
      systemLabels: [SystemLabel.Default],
    },
    seenSinceLastContentUpdate: [],
    progress: null,
    hasUnopenedContent: true,
    fromServiceOwnerTransmissionsCount: 1,
    fromPartyTransmissionsCount: 0,
    guiAttachmentCount: 3,
  },
  {
    id: '01939be1-abaa-70e7-9301-2c96e773145c',
    party: 'urn:altinn:organization:identifier-no:315073693',
    org: 'dmf',
    serviceResource: 'default',
    serviceResourceType: 'correspondenceservice',
    status: DialogStatus.InProgress,
    createdAt: '2024-03-12T08:20:00Z',
    contentUpdatedAt: '2024-03-12T08:20:00Z',
    content: {
      title: {
        mediaType: 'text/plain',
        value: [
          { value: 'MVA-melding Q1 2024', languageCode: 'nb' },
          { value: 'VAT report Q1 2024', languageCode: 'en' },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [
          { value: 'Frist for innsending er 15. april', languageCode: 'nb' },
          { value: 'Submission deadline is April 15', languageCode: 'en' },
        ],
      },
      senderName: null,
      extendedStatus: null,
    },
    endUserContext: {
      systemLabels: [SystemLabel.Default],
    },
    seenSinceLastContentUpdate: [],
    progress: 30,
    hasUnopenedContent: false,
    fromServiceOwnerTransmissionsCount: 1,
    fromPartyTransmissionsCount: 1,
    guiAttachmentCount: 0,
  },
  {
    id: '01939be1-3fc5-775e-8b7f-7710b348d210',
    party: 'urn:altinn:organization:identifier-no:314518748',
    org: 'ssb',
    serviceResource: 'default',
    serviceResourceType: 'correspondenceservice',
    status: DialogStatus.RequiresAttention,
    createdAt: '2024-01-30T10:00:00Z',
    contentUpdatedAt: '2024-01-30T10:00:00Z',
    content: {
      title: {
        mediaType: 'text/plain',
        value: [
          { value: 'Statistikkrapportering', languageCode: 'nb' },
          { value: 'Statistics reporting', languageCode: 'en' },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [
          { value: 'Påkrevd statistikkrapportering må leveres', languageCode: 'nb' },
          { value: 'Required statistics reporting must be submitted', languageCode: 'en' },
        ],
      },
      senderName: null,
      extendedStatus: null,
    },
    endUserContext: {
      systemLabels: [SystemLabel.Default],
    },
    seenSinceLastContentUpdate: [],
    progress: null,
    hasUnopenedContent: true,
    fromServiceOwnerTransmissionsCount: 1,
    fromPartyTransmissionsCount: 0,
    guiAttachmentCount: 1,
  },
  {
    id: '01939be0-a01f-71bb-8f01-9a3bbeaf3324',
    party: 'urn:altinn:organization:identifier-no:316892451',
    org: 'dmf',
    serviceResource: 'default',
    serviceResourceType: 'correspondenceservice',
    status: DialogStatus.Completed,
    createdAt: '2024-02-05T13:30:00Z',
    contentUpdatedAt: '2024-02-10T09:15:00Z',
    content: {
      title: {
        mediaType: 'text/plain',
        value: [
          { value: 'Tillatelse godkjent', languageCode: 'nb' },
          { value: 'Permit approved', languageCode: 'en' },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [
          { value: 'Din søknad om tillatelse er godkjent', languageCode: 'nb' },
          { value: 'Your application for permit has been approved', languageCode: 'en' },
        ],
      },
      senderName: null,
      extendedStatus: null,
    },
    endUserContext: {
      systemLabels: [SystemLabel.Default],
    },
    seenSinceLastContentUpdate: [],
    progress: 100,
    hasUnopenedContent: false,
    fromServiceOwnerTransmissionsCount: 2,
    fromPartyTransmissionsCount: 0,
    guiAttachmentCount: 2,
  },
  {
    id: '01939be0-15e1-72ab-8261-2798d078b57c',
    party: 'urn:altinn:organization:identifier-no:317654823',
    org: 'kartverket',
    serviceResource: 'default',
    serviceResourceType: 'correspondenceservice',
    status: DialogStatus.RequiresAttention,
    createdAt: '2024-03-01T09:00:00Z',
    contentUpdatedAt: '2024-03-01T09:00:00Z',
    content: {
      title: {
        mediaType: 'text/plain',
        value: [
          { value: 'Eiendomsgrense må avklares', languageCode: 'nb' },
          { value: 'Property boundary must be clarified', languageCode: 'en' },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [
          { value: 'Det er uklarheter om eiendomsgrensen som må avklares', languageCode: 'nb' },
          { value: 'There are uncertainties about the property boundary that need clarification', languageCode: 'en' },
        ],
      },
      senderName: null,
      extendedStatus: null,
    },
    endUserContext: {
      systemLabels: [SystemLabel.Default],
    },
    seenSinceLastContentUpdate: [],
    progress: null,
    hasUnopenedContent: true,
    fromServiceOwnerTransmissionsCount: 1,
    fromPartyTransmissionsCount: 0,
    guiAttachmentCount: 1,
  },
  {
    id: '01939b61-8b48-778b-8132-b94bc5f05484',
    party: 'urn:altinn:organization:identifier-no:318945672',
    org: 'miljodirektoratet',
    serviceResource: 'default',
    serviceResourceType: 'correspondenceservice',
    status: DialogStatus.InProgress,
    createdAt: '2024-02-15T14:00:00Z',
    contentUpdatedAt: '2024-02-15T14:00:00Z',
    content: {
      title: {
        mediaType: 'text/plain',
        value: [
          { value: 'Miljørapport 2023', languageCode: 'nb' },
          { value: 'Environmental report 2023', languageCode: 'en' },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [
          { value: 'Årlig miljørapport må leveres innen 30. april', languageCode: 'nb' },
          { value: 'Annual environmental report must be submitted by April 30', languageCode: 'en' },
        ],
      },
      senderName: null,
      extendedStatus: null,
    },
    endUserContext: {
      systemLabels: [SystemLabel.Default],
    },
    seenSinceLastContentUpdate: [],
    progress: 60,
    hasUnopenedContent: false,
    fromServiceOwnerTransmissionsCount: 1,
    fromPartyTransmissionsCount: 1,
    guiAttachmentCount: 0,
  },
  {
    id: '01939b61-1234-778b-8132-b94bc5f05485',
    party: 'urn:altinn:organization:identifier-no:319823456',
    org: 'dmf',
    serviceResource: 'default',
    serviceResourceType: 'correspondenceservice',
    status: DialogStatus.RequiresAttention,
    createdAt: '2024-03-10T11:00:00Z',
    contentUpdatedAt: '2024-03-10T11:00:00Z',
    content: {
      title: {
        mediaType: 'text/plain',
        value: [
          { value: 'Kontrollrapport påkrevd', languageCode: 'nb' },
          { value: 'Control report required', languageCode: 'en' },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [
          { value: 'Vennligst lever kontrollrapport for 2023', languageCode: 'nb' },
          { value: 'Please submit control report for 2023', languageCode: 'en' },
        ],
      },
      senderName: null,
      extendedStatus: null,
    },
    endUserContext: {
      systemLabels: [SystemLabel.Default],
    },
    seenSinceLastContentUpdate: [],
    progress: null,
    hasUnopenedContent: true,
    fromServiceOwnerTransmissionsCount: 1,
    fromPartyTransmissionsCount: 0,
    guiAttachmentCount: 1,
  },
  {
    id: '01939b61-5678-778b-8132-b94bc5f05486',
    party: 'urn:altinn:organization:identifier-no:311615688',
    org: 'dmf',
    serviceResource: 'default',
    serviceResourceType: 'correspondenceservice',
    status: DialogStatus.InProgress,
    createdAt: '2024-02-20T10:30:00Z',
    contentUpdatedAt: '2024-02-20T10:30:00Z',
    content: {
      title: {
        mediaType: 'text/plain',
        value: [
          { value: 'Underenhet: Årsmelding', languageCode: 'nb' },
          { value: 'Subunit: Annual report', languageCode: 'en' },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [
          { value: 'Årsmelding for underenheten må leveres', languageCode: 'nb' },
          { value: 'Annual report for the subunit must be submitted', languageCode: 'en' },
        ],
      },
      senderName: null,
      extendedStatus: null,
    },
    endUserContext: {
      systemLabels: [SystemLabel.Default],
    },
    seenSinceLastContentUpdate: [],
    progress: 40,
    hasUnopenedContent: false,
    fromServiceOwnerTransmissionsCount: 1,
    fromPartyTransmissionsCount: 1,
    guiAttachmentCount: 1,
  },
  // Dialogs for deleted organizations
  {
    id: '01939b60-9abc-778b-8132-b94bc5f05487',
    party: 'urn:altinn:organization:identifier-no:215421902',
    org: 'brreg',
    serviceResource: 'default',
    serviceResourceType: 'correspondenceservice',
    status: DialogStatus.NotApplicable,
    createdAt: '2023-12-15T09:00:00Z',
    contentUpdatedAt: '2023-12-15T09:00:00Z',
    content: {
      title: {
        mediaType: 'text/plain',
        value: [
          { value: 'Varsel om sletting', languageCode: 'nb' },
          { value: 'Notice of deletion', languageCode: 'en' },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [
          { value: 'Virksomheten vil bli slettet fra registeret', languageCode: 'nb' },
          { value: 'The business will be deleted from the registry', languageCode: 'en' },
        ],
      },
      senderName: null,
      extendedStatus: null,
    },
    endUserContext: {
      systemLabels: [SystemLabel.Default],
    },
    seenSinceLastContentUpdate: [],
    progress: null,
    hasUnopenedContent: false,
    fromServiceOwnerTransmissionsCount: 1,
    fromPartyTransmissionsCount: 0,
    guiAttachmentCount: 1,
  },
  {
    id: '01939b60-def0-778b-8132-b94bc5f05488',
    party: 'urn:altinn:organization:identifier-no:311615696',
    org: 'skatteetaten',
    serviceResource: 'default',
    serviceResourceType: 'correspondenceservice',
    status: DialogStatus.NotApplicable,
    createdAt: '2023-11-20T14:30:00Z',
    contentUpdatedAt: '2023-11-20T14:30:00Z',
    content: {
      title: {
        mediaType: 'text/plain',
        value: [
          { value: 'Siste skatteoppgjør', languageCode: 'nb' },
          { value: 'Final tax settlement', languageCode: 'en' },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [
          { value: 'Dette er det siste skatteoppgjøret for virksomheten', languageCode: 'nb' },
          { value: 'This is the final tax settlement for the business', languageCode: 'en' },
        ],
      },
      senderName: null,
      extendedStatus: null,
    },
    endUserContext: {
      systemLabels: [SystemLabel.Default],
    },
    seenSinceLastContentUpdate: [],
    progress: null,
    hasUnopenedContent: false,
    fromServiceOwnerTransmissionsCount: 1,
    fromPartyTransmissionsCount: 0,
    guiAttachmentCount: 2,
  },
  {
    id: '01939b60-1234-778b-8132-b94bc5f05489',
    party: 'urn:altinn:organization:identifier-no:311615697',
    org: 'nav',
    serviceResource: 'default',
    serviceResourceType: 'correspondenceservice',
    status: DialogStatus.NotApplicable,
    createdAt: '2023-10-10T11:15:00Z',
    contentUpdatedAt: '2023-10-10T11:15:00Z',
    content: {
      title: {
        mediaType: 'text/plain',
        value: [
          { value: 'Avslutning av arbeidsforhold', languageCode: 'nb' },
          { value: 'Termination of employment', languageCode: 'en' },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [
          { value: 'Alle arbeidsforhold er avsluttet', languageCode: 'nb' },
          { value: 'All employment relationships have been terminated', languageCode: 'en' },
        ],
      },
      senderName: null,
      extendedStatus: null,
    },
    endUserContext: {
      systemLabels: [SystemLabel.Default],
    },
    seenSinceLastContentUpdate: [],
    progress: null,
    hasUnopenedContent: false,
    fromServiceOwnerTransmissionsCount: 1,
    fromPartyTransmissionsCount: 0,
    guiAttachmentCount: 0,
  },
  {
    id: '01939b60-5678-778b-8132-b94bc5f05490',
    party: 'urn:altinn:organization:identifier-no:412567893',
    org: 'brreg',
    serviceResource: 'default',
    serviceResourceType: 'correspondenceservice',
    status: DialogStatus.NotApplicable,
    createdAt: '2023-09-15T10:00:00Z',
    contentUpdatedAt: '2023-09-15T10:00:00Z',
    content: {
      title: {
        mediaType: 'text/plain',
        value: [
          { value: 'Konkurserklæring', languageCode: 'nb' },
          { value: 'Bankruptcy declaration', languageCode: 'en' },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [
          { value: 'Virksomheten er erklært konkurs', languageCode: 'nb' },
          { value: 'The business has been declared bankrupt', languageCode: 'en' },
        ],
      },
      senderName: null,
      extendedStatus: null,
    },
    endUserContext: {
      systemLabels: [SystemLabel.Default],
    },
    seenSinceLastContentUpdate: [],
    progress: null,
    hasUnopenedContent: false,
    fromServiceOwnerTransmissionsCount: 1,
    fromPartyTransmissionsCount: 0,
    guiAttachmentCount: 1,
  },
  {
    id: '01939b60-9abc-778b-8132-b94bc5f05491',
    party: 'urn:altinn:organization:identifier-no:413892765',
    org: 'dmf',
    serviceResource: 'default',
    serviceResourceType: 'correspondenceservice',
    status: DialogStatus.NotApplicable,
    createdAt: '2023-08-20T13:00:00Z',
    contentUpdatedAt: '2023-08-20T13:00:00Z',
    content: {
      title: {
        mediaType: 'text/plain',
        value: [
          { value: 'Avslutning av virksomhet', languageCode: 'nb' },
          { value: 'Business closure', languageCode: 'en' },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [
          { value: 'Virksomheten er permanent stengt', languageCode: 'nb' },
          { value: 'The business is permanently closed', languageCode: 'en' },
        ],
      },
      senderName: null,
      extendedStatus: null,
    },
    endUserContext: {
      systemLabels: [SystemLabel.Default],
    },
    seenSinceLastContentUpdate: [],
    progress: null,
    hasUnopenedContent: false,
    fromServiceOwnerTransmissionsCount: 1,
    fromPartyTransmissionsCount: 0,
    guiAttachmentCount: 0,
  },
  {
    id: '01939b60-def0-778b-8132-b94bc5f05492',
    party: 'urn:altinn:organization:identifier-no:414678923',
    org: 'skatteetaten',
    serviceResource: 'default',
    serviceResourceType: 'correspondenceservice',
    status: DialogStatus.NotApplicable,
    createdAt: '2023-07-10T09:30:00Z',
    contentUpdatedAt: '2023-07-10T09:30:00Z',
    content: {
      title: {
        mediaType: 'text/plain',
        value: [
          { value: 'Siste MVA-oppgjør', languageCode: 'nb' },
          { value: 'Final VAT settlement', languageCode: 'en' },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [
          { value: 'Dette er det siste MVA-oppgjøret før oppløsning', languageCode: 'nb' },
          { value: 'This is the final VAT settlement before dissolution', languageCode: 'en' },
        ],
      },
      senderName: null,
      extendedStatus: null,
    },
    endUserContext: {
      systemLabels: [SystemLabel.Default],
    },
    seenSinceLastContentUpdate: [],
    progress: null,
    hasUnopenedContent: false,
    fromServiceOwnerTransmissionsCount: 1,
    fromPartyTransmissionsCount: 0,
    guiAttachmentCount: 1,
  },
];
