import { describe, expect, it } from 'vitest';
import { validateCreateDialog } from './dialogSchema.ts';
import { normalizePastedDialog } from './normalizePastedDialog.ts';

const nb = (value: string) => [{ languageCode: 'nb', value }];

const restResponse = {
  id: '019241f7-5fa0-7336-934d-716a8e5bbb49',
  revision: 'd6b2e4f0-0000-0000-0000-000000000000',
  org: 'skd',
  serviceResource: 'urn:altinn:resource:skattemelding',
  serviceResourceType: 'CorrespondenceService',
  party: 'urn:altinn:organization:identifier-no:991825827',
  progress: null,
  extendedStatus: null,
  dueAt: null,
  expiresAt: '2030-01-01T00:00:00.000Z',
  createdAt: '2026-01-01T09:00:00.000Z',
  updatedAt: '2026-01-02T09:00:00.000Z',
  contentUpdatedAt: '2026-01-03T09:00:00.000Z',
  deletedAt: null,
  status: 'RequiresAttention',
  systemLabel: 'Default',
  isContentSeen: false,
  hasUnopenedContent: true,
  fromServiceOwnerTransmissionsCount: 1,
  fromPartyTransmissionsCount: 0,
  endUserContext: { revision: 'abc', systemLabels: ['Archive'] },
  seenSinceLastUpdate: [],
  seenSinceLastContentUpdate: [{ id: 's', seenAt: '2026-01-03T09:00:00.000Z', isCurrentEndUser: true }],
  content: {
    title: { value: nb('Skattemelding'), mediaType: 'text/plain' },
    summary: { value: nb('Sammendrag'), mediaType: 'text/plain' },
    senderName: null,
    additionalInfo: null,
    extendedStatus: null,
    mainContentReference: null,
  },
  attachments: [
    {
      id: 'attachment',
      displayName: nb('Vedlegg'),
      isAuthorized: true,
      urls: [{ id: 'url', url: 'https://example.com/a.pdf', mediaType: 'application/pdf', consumerType: 'Gui' }],
    },
  ],
  guiActions: [
    {
      id: 'action',
      action: 'read',
      url: 'urn:dialogporten:unauthorized',
      isAuthorized: false,
      isDeleteDialogAction: false,
      httpMethod: 'GET',
      priority: 'Primary',
      title: nb('Åpne'),
      prompt: [],
    },
  ],
  apiActions: [],
  activities: [
    {
      id: 'activity',
      createdAt: '2026-01-01T09:00:00.000Z',
      type: 'DialogCreated',
      performedBy: { actorType: 'ServiceOwner', actorId: null, actorName: null },
      description: [],
    },
  ],
  transmissions: [
    {
      id: 'transmission',
      createdAt: '2026-01-02T09:00:00.000Z',
      type: 'Information',
      isAuthorized: true,
      isOpened: false,
      sender: { actorType: 'ServiceOwner' },
      content: { title: { value: nb('Melding'), mediaType: 'text/plain' }, summary: null, contentReference: null },
      attachments: [],
      navigationalActions: [{ title: nb('Svar'), url: 'https://example.com/svar', isAuthorized: true }],
    },
  ],
};

const graphqlResponse = {
  data: {
    dialogById: {
      errors: [],
      dialog: {
        __typename: 'Dialog',
        id: 'dialog',
        dialogToken: 'token',
        org: 'nav',
        party: 'urn:altinn:person:identifier-no:enc:abc',
        serviceResourceType: 'altinnapp',
        status: 'REQUIRES_ATTENTION',
        contentUpdatedAt: '2026-01-03T09:00:00.000Z',
        endUserContext: { systemLabels: ['BIN'] },
        seenSinceLastContentUpdate: [],
        content: { title: { mediaType: 'text/plain', value: nb('Fra GraphQL') }, summary: null },
        attachments: [
          {
            id: 'a',
            displayName: nb('Vedlegg'),
            expiresAt: null,
            urls: [{ id: 'u', url: 'https://example.com', consumerType: 'GUI', mediaType: null }],
          },
        ],
        guiActions: [
          {
            id: 'g',
            action: 'read',
            url: 'https://example.com',
            isAuthorized: true,
            isDeleteDialogAction: false,
            authorizationAttribute: null,
            priority: 'PRIMARY',
            httpMethod: 'POST',
            title: nb('Send'),
            prompt: null,
          },
        ],
        activities: [
          {
            id: 'b',
            type: 'DIALOG_CREATED',
            performedBy: { actorType: 'SERVICE_OWNER', actorId: null, actorName: null },
            description: [],
            transmissionId: null,
          },
        ],
        transmissions: [],
      },
    },
  },
};

describe('normalizePastedDialog', () => {
  describe('REST response', () => {
    const { dialog, org, serviceResourceType } = normalizePastedDialog(restResponse);

    it('is valid, without warnings about response fields', () => {
      const { errors, warnings } = validateCreateDialog(dialog);
      expect(errors).toEqual([]);
      expect(warnings).toEqual([]);
    });

    it('reads what the create format has no room for', () => {
      expect(org).toBe('skd');
      expect(serviceResourceType).toBe('correspondenceservice');
    });

    it('removes the dialog id, so the JSON can create a new dialog', () => {
      expect(dialog).not.toHaveProperty('id');
    });

    it('uses the time the content changed, as a real dialog does', () => {
      expect(dialog).toHaveProperty('updatedAt', restResponse.contentUpdatedAt);
    });

    it('keeps the ids that references between items depend on', () => {
      expect(dialog).toMatchObject({ transmissions: [{ id: 'transmission' }] });
    });
  });

  describe('GraphQL response', () => {
    const { dialog, org, serviceResourceType } = normalizePastedDialog(graphqlResponse);

    it('is valid, without warnings', () => {
      const { errors, warnings } = validateCreateDialog(dialog);
      expect(errors).toEqual([]);
      expect(warnings).toEqual([]);
    });

    it('converts enums to the REST format', () => {
      expect(dialog).toMatchObject({
        status: 'RequiresAttention',
        systemLabel: 'Bin',
        attachments: [{ urls: [{ consumerType: 'Gui' }] }],
        guiActions: [{ priority: 'Primary', httpMethod: 'POST' }],
        activities: [{ type: 'DialogCreated', performedBy: { actorType: 'ServiceOwner' } }],
      });
    });

    it('fills in the service resource, which the query does not return', () => {
      expect(dialog).toHaveProperty('serviceResource', 'urn:altinn:resource:fyll-inn');
    });

    it('reads org and resource type', () => {
      expect(org).toBe('nav');
      expect(serviceResourceType).toBe('altinnapp');
    });
  });

  describe('create body', () => {
    const body = {
      id: 'self-defined',
      serviceResource: 'urn:altinn:resource:test',
      party: 'urn:altinn:organization:identifier-no:991825827',
      content: { title: { value: nb('Tittel') } },
      guiActions: [{ action: 'read', url: 'https://example.com', priority: 'Primary', title: nb('Åpne'), prompt: [] }],
    };

    it('keeps a self-defined id and leaves origin empty', () => {
      const { dialog, org, serviceResourceType } = normalizePastedDialog(body);
      expect(dialog).toHaveProperty('id', 'self-defined');
      expect(org).toBeUndefined();
      expect(serviceResourceType).toBeUndefined();
    });

    it('accepts empty optional lists, which the API also accepts', () => {
      expect(validateCreateDialog(normalizePastedDialog(body).dialog).errors).toEqual([]);
    });
  });

  it('still rejects unsafe URLs in a response', () => {
    const { dialog } = normalizePastedDialog({
      ...restResponse,
      guiActions: [{ ...restResponse.guiActions[0], url: 'javascript:alert(1)' }],
    });
    expect(validateCreateDialog(dialog).errors.map(({ path }) => path)).toEqual(['guiActions.0.url']);
  });

  it('passes on input that is not a dialog, so validation can report it', () => {
    expect(normalizePastedDialog(null).dialog).toBeNull();
    expect(normalizePastedDialog([1]).dialog).toEqual([1]);
  });
});
