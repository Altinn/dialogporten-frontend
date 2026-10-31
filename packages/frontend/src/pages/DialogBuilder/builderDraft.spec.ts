import { describe, expect, it } from 'vitest';
import {
  createInitialState,
  createSampleDialog,
  type DialogDraft,
  findLanguages,
  PERSON_PARTY_PLACEHOLDER,
  setLocalization,
  toDialogJson,
} from './builderDraft.ts';
import { validateCreateDialog } from './dialogSchema.ts';

const ORGANIZATION = 'urn:altinn:organization:identifier-no:991825827';
const ENCRYPTED_PERSON = 'urn:altinn:person:identifier-no:enc:abc123';
const PLAIN_PERSON = 'urn:altinn:person:identifier-no:26826198191';

const draft: DialogDraft = {
  serviceResource: 'urn:altinn:resource:test',
  content: { title: { value: [{ languageCode: 'nb', value: 'Tittel' }] } },
};

describe('toDialogJson', () => {
  it('uses the selected organisation as party', () => {
    expect(toDialogJson(draft, ORGANIZATION).party).toBe(ORGANIZATION);
  });

  it('uses a placeholder for persons, whose URN the frontend only has encrypted', () => {
    expect(toDialogJson(draft, ENCRYPTED_PERSON).party).toBe(PERSON_PARTY_PLACEHOLDER);
  });

  it('keeps a pasted plain person URN when a person is selected', () => {
    expect(toDialogJson({ ...draft, party: PLAIN_PERSON }, ENCRYPTED_PERSON).party).toBe(PLAIN_PERSON);
  });

  it('replaces a pasted party when an organisation is selected', () => {
    expect(toDialogJson({ ...draft, party: PLAIN_PERSON }, ORGANIZATION).party).toBe(ORGANIZATION);
  });

  it('leaves party out when no single party is selected', () => {
    expect(validateCreateDialog(toDialogJson(draft, undefined)).errors.map(({ path }) => path)).toEqual(['party']);
  });

  it('removes empty optional values but keeps false and zero', () => {
    const json = toDialogJson(
      {
        ...draft,
        progress: 0,
        extendedStatus: '',
        dueAt: null,
        attachments: [],
        content: {
          ...draft.content,
          summary: { value: [] },
          additionalInfo: { value: [], mediaType: 'text/markdown' },
        },
        guiActions: [
          {
            action: 'read',
            url: 'https://example.com',
            priority: 'Primary',
            isDeleteDialogAction: false,
            title: [{ languageCode: 'nb', value: 'Åpne' }],
            prompt: [],
          },
        ],
      },
      ORGANIZATION,
    );

    expect(json).toEqual({
      party: ORGANIZATION,
      serviceResource: draft.serviceResource,
      progress: 0,
      content: draft.content,
      guiActions: [
        {
          action: 'read',
          url: 'https://example.com',
          priority: 'Primary',
          isDeleteDialogAction: false,
          title: [{ languageCode: 'nb', value: 'Åpne' }],
        },
      ],
    });
  });

  it('keeps fields the form does not know about', () => {
    const json = toDialogJson({ ...draft, externalReference: 'sak-1' }, ORGANIZATION);
    expect(json.externalReference).toBe('sak-1');
  });
});

describe('setLocalization', () => {
  it('adds, replaces and removes a language without touching the others', () => {
    const nb = setLocalization([], 'nb', 'Hei');
    const nbAndEn = setLocalization(nb, 'en', 'Hi');
    expect(setLocalization(nbAndEn, 'nb', 'Hallo')).toEqual([
      { languageCode: 'en', value: 'Hi' },
      { languageCode: 'nb', value: 'Hallo' },
    ]);
    expect(setLocalization(nbAndEn, 'nb', '')).toEqual([{ languageCode: 'en', value: 'Hi' }]);
  });
});

describe('findLanguages', () => {
  it('finds the languages used anywhere in the dialog', () => {
    expect(
      findLanguages({
        ...draft,
        guiActions: [
          {
            action: 'read',
            url: 'https://example.com',
            priority: 'Primary',
            title: [{ languageCode: 'en', value: 'Open' }],
          },
        ],
      }),
    ).toEqual(['nb', 'en']);
  });

  it('falls back to bokmål', () => {
    expect(findLanguages({ ...draft, content: { title: { value: [] } } })).toEqual(['nb']);
  });
});

describe('createInitialState', () => {
  it('restores a decoded preview', () => {
    const state = createInitialState({
      status: 'valid',
      org: 'skd',
      serviceResourceType: 'altinnapp',
      dialog: draft,
    });
    expect(state).toEqual({ org: 'skd', serviceResourceType: 'altinnapp', languages: ['nb'], dialog: draft });
  });

  it('starts empty otherwise', () => {
    expect(createInitialState({ status: 'missing' }).dialog.content.title.value).toEqual([]);
  });
});

describe('createSampleDialog', () => {
  it('is valid', () => {
    expect(validateCreateDialog(toDialogJson(createSampleDialog(), ORGANIZATION)).errors).toEqual([]);
  });
});
