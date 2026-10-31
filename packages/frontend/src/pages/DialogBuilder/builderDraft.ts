import {
  type CreateDialog,
  LANGUAGES,
  type Language,
  type Localization,
  type PreviewDialog,
  type ServiceResourceType,
} from './dialogSchema.ts';
import type { DecodedPreview } from './previewEnvelope.ts';

const PERSON_URN_PREFIX = 'urn:altinn:person:identifier-no:';
const ENCRYPTED_PERSON_URN_PREFIX = `${PERSON_URN_PREFIX}enc:`;
const DEFAULT_ORG = 'digdir';
const DEFAULT_SERVICE_RESOURCE_TYPE: ServiceResourceType = 'genericaccessresource';

export const PERSON_PARTY_PLACEHOLDER = `${PERSON_URN_PREFIX}<fødselsnummer>`;

export type DialogDraft = PreviewDialog & { party?: string };

export interface BuilderState {
  org: string;
  serviceResourceType: ServiceResourceType;
  languages: Language[];
  dialog: DialogDraft;
}

const createEmptyDialog = (): DialogDraft => ({
  serviceResource: '',
  status: 'NotApplicable',
  content: { title: { value: [] } },
});

const nb = (value: string): Localization[] => [{ languageCode: 'nb', value }];

export const createSampleDialog = (): DialogDraft => ({
  serviceResource: 'urn:altinn:resource:super-simple-service',
  status: 'RequiresAttention',
  content: {
    title: { value: nb('Test-søknad om digitalisering') },
    summary: { value: nb('Denne dialogen viser saksgangen knyttet til en innsendt søknad om digitalisering.') },
    senderName: { value: nb('Digitaliseringsdirektoratet') },
    additionalInfo: {
      value: nb('Denne teksten er **tilleggsinformasjon** til dialogen.'),
      mediaType: 'text/markdown',
    },
  },
  attachments: [
    {
      displayName: nb('Kopi av innsendt søknad'),
      urls: [{ url: 'https://example.com/soknad.pdf', mediaType: 'application/pdf', consumerType: 'Gui' }],
    },
    {
      displayName: nb('Les mer om ordningen'),
      urls: [{ url: 'https://example.com/les-mer', mediaType: 'text/html', consumerType: 'Gui' }],
    },
  ],
  guiActions: [
    {
      action: 'read',
      url: 'https://example.com/sporsmal',
      httpMethod: 'GET',
      priority: 'Primary',
      title: nb('Still spørsmål'),
    },
    {
      action: 'write',
      url: 'https://example.com/ettersending',
      httpMethod: 'POST',
      priority: 'Secondary',
      title: nb('Ettersend informasjon'),
    },
  ],
  activities: [
    { type: 'DialogCreated', performedBy: { actorType: 'ServiceOwner' } },
    {
      type: 'Information',
      performedBy: { actorType: 'ServiceOwner' },
      description: nb('Søknaden er mottatt og sendt til saksbehandling.'),
    },
  ],
  transmissions: [
    {
      type: 'Information',
      sender: { actorType: 'ServiceOwner' },
      content: {
        title: { value: nb('Svar på søknad') },
        summary: { value: nb('Vi har behandlet søknaden din.') },
      },
      attachments: [
        {
          displayName: nb('Vedtak'),
          urls: [{ url: 'https://example.com/vedtak.pdf', mediaType: 'application/pdf', consumerType: 'Gui' }],
        },
      ],
      navigationalActions: [{ title: nb('Svar på vedtaket'), url: 'https://example.com/svar' }],
    },
  ],
});

export const findLanguages = (dialog: DialogDraft): Language[] => {
  const json = JSON.stringify(dialog);
  const languages = LANGUAGES.filter((language) => json.includes(`"languageCode":"${language}"`));
  return languages.length > 0 ? languages : ['nb'];
};

export const createInitialState = (decoded: DecodedPreview): BuilderState => {
  if (decoded.status === 'valid') {
    const { org, serviceResourceType, dialog } = decoded;
    return { org, serviceResourceType, languages: findLanguages(dialog), dialog };
  }
  return {
    org: DEFAULT_ORG,
    serviceResourceType: DEFAULT_SERVICE_RESOURCE_TYPE,
    languages: ['nb'],
    dialog: createEmptyDialog(),
  };
};

export const setLocalization = (
  values: Localization[] | null | undefined,
  languageCode: string,
  value: string,
): Localization[] => {
  const others = (values ?? []).filter((localization) => localization.languageCode !== languageCode);
  return value ? [...others, { languageCode, value }] : others;
};

export const prune = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    const items = value.map(prune).filter((item) => item !== undefined);
    return items.length > 0 ? items : undefined;
  }
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value)
      .map(([key, item]) => [key, prune(item)] as const)
      .filter(([, item]) => item !== undefined);
    const isEmptyContentValue = entries.length === 1 && entries[0][0] === 'mediaType';
    return entries.length === 0 || isEmptyContentValue ? undefined : Object.fromEntries(entries);
  }
  return value === '' || value === null ? undefined : value;
};

const resolveParty = (selectedParty: string | undefined, draftParty: string | undefined): string | undefined => {
  if (!selectedParty?.startsWith(ENCRYPTED_PERSON_URN_PREFIX)) {
    return selectedParty;
  }
  const isPlainPersonUrn =
    draftParty?.startsWith(PERSON_URN_PREFIX) && !draftParty.startsWith(ENCRYPTED_PERSON_URN_PREFIX);
  return isPlainPersonUrn && draftParty !== PERSON_PARTY_PLACEHOLDER ? draftParty : PERSON_PARTY_PLACEHOLDER;
};

export const toDialogJson = ({ party, ...dialog }: DialogDraft, selectedParty: string | undefined) =>
  ({ party: resolveParty(selectedParty, party), ...(prune(dialog) as object) }) as Partial<CreateDialog>;
