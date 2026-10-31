import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { describe, expect, it } from 'vitest';
import type { CreateDialog } from './dialogSchema.ts';
import { decodePreview, encodePreview } from './previewEnvelope.ts';

const dialog: CreateDialog = {
  serviceResource: 'urn:altinn:resource:test',
  party: 'urn:altinn:person:identifier-no:26826198191',
  content: { title: { value: [{ languageCode: 'nb', value: 'Søknad om blåbærsyltetøy' }] } },
};

const encodeRaw = (value: unknown) => compressToEncodedURIComponent(JSON.stringify(value));

describe('previewEnvelope', () => {
  it('round-trips through URL search params, keeping Norwegian characters', () => {
    const params = new URLSearchParams();
    params.set('dialog', encodePreview('digdir', 'genericaccessresource', dialog));

    const decoded = decodePreview(new URLSearchParams(params.toString()).get('dialog'));

    expect(decoded).toMatchObject({
      status: 'valid',
      org: 'digdir',
      serviceResourceType: 'genericaccessresource',
      dialog: { content: { title: { value: [{ value: 'Søknad om blåbærsyltetøy' }] } } },
    });
  });

  it('leaves party out of the encoded payload', () => {
    const encoded = encodePreview('digdir', 'altinnapp', dialog);
    expect(decompressFromEncodedURIComponent(encoded)).not.toContain('26826198191');
    expect(decodePreview(encoded)).toMatchObject({
      status: 'valid',
      dialog: { serviceResource: dialog.serviceResource },
    });
  });

  it('masks person identifiers elsewhere in the dialog', () => {
    const encoded = encodePreview('digdir', 'altinnapp', {
      ...dialog,
      activities: [
        {
          type: 'Information',
          performedBy: { actorType: 'PartyRepresentative', actorId: 'urn:altinn:person:identifier-no:26826198191' },
        },
      ],
    });
    const json = decompressFromEncodedURIComponent(encoded);
    expect(json).not.toContain('26826198191');
    expect(json).toContain('urn:altinn:person:identifier-no:00000000000');
  });

  it('reports a missing parameter separately from an invalid one', () => {
    expect(decodePreview(null)).toEqual({ status: 'missing' });
    expect(decodePreview('')).toEqual({ status: 'missing' });
    expect(decodePreview('ikke-gyldig').status).toBe('invalid');
  });

  it('rejects unknown envelope versions', () => {
    const { party: _party, ...payload } = dialog;
    const encoded = encodeRaw({ v: 2, org: 'digdir', serviceResourceType: 'altinnapp', dialog: payload });
    expect(decodePreview(encoded).status).toBe('invalid');
  });

  it('does not let a crafted link pollute object prototypes', () => {
    const { party: _party, ...payload } = dialog;
    const json = JSON.stringify({ v: 1, org: 'digdir', serviceResourceType: 'altinnapp', dialog: payload });
    const encoded = compressToEncodedURIComponent(
      json.replace('"serviceResource"', '"__proto__":{"polluted":true},"serviceResource"'),
    );

    decodePreview(encoded);

    expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
  });

  it('validates the dialog when it is loaded, so a crafted link cannot carry unsafe URLs', () => {
    const { party: _party, ...payload } = dialog;
    const encoded = encodeRaw({
      v: 1,
      org: 'digdir',
      serviceResourceType: 'altinnapp',
      dialog: {
        ...payload,
        guiActions: [
          {
            action: 'read',
            url: 'javascript:alert(document.domain)',
            priority: 'Primary',
            title: [{ languageCode: 'nb', value: 'Klikk' }],
          },
        ],
      },
    });

    expect(decodePreview(encoded)).toMatchObject({
      status: 'invalid',
      errors: [{ path: 'guiActions.0.url' }],
    });
  });
});
