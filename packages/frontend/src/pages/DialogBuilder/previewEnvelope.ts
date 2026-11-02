import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { z } from 'zod';
import {
  type CreateDialog,
  type PreviewDialog,
  SERVICE_RESOURCE_TYPES,
  type ServiceResourceType,
  type ValidationIssue,
  validatePreviewDialog,
} from './dialogSchema.ts';

const ENVELOPE_VERSION = 1;
const MASKED_PERSON_URN = 'urn:altinn:person:identifier-no:00000000000';
const PERSON_URN_PATTERN = /urn:altinn:person:identifier-no:[^"]+/g;

const envelopeSchema = z.object({
  v: z.literal(ENVELOPE_VERSION),
  org: z.string().min(1),
  serviceResourceType: z.enum(SERVICE_RESOURCE_TYPES),
  dialog: z.unknown(),
});

export interface PreviewEnvelope {
  org: string;
  serviceResourceType: ServiceResourceType;
  dialog: PreviewDialog;
}

export type DecodedPreview =
  | { status: 'missing' }
  | { status: 'invalid'; errors: ValidationIssue[] }
  | ({ status: 'valid' } & PreviewEnvelope);

const invalid = (message: string): DecodedPreview => ({ status: 'invalid', errors: [{ path: '', message }] });

export const encodePreview = (org: string, serviceResourceType: ServiceResourceType, dialog: CreateDialog): string => {
  const { party: _party, ...dialogWithoutParty } = dialog;
  const json = JSON.stringify({ v: ENVELOPE_VERSION, org, serviceResourceType, dialog: dialogWithoutParty });
  return compressToEncodedURIComponent(json.replace(PERSON_URN_PATTERN, MASKED_PERSON_URN));
};

export const decodePreview = (encoded: string | null): DecodedPreview => {
  if (!encoded) {
    return { status: 'missing' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(decompressFromEncodedURIComponent(encoded) ?? '');
  } catch {
    return invalid('Kunne ikke lese dialogen fra lenken.');
  }

  const envelope = envelopeSchema.safeParse(parsed);
  if (!envelope.success) {
    return invalid('Lenken har et ukjent format.');
  }

  const { dialog, errors } = validatePreviewDialog(envelope.data.dialog);
  if (!dialog) {
    return { status: 'invalid', errors };
  }

  return {
    status: 'valid',
    org: envelope.data.org,
    serviceResourceType: envelope.data.serviceResourceType,
    dialog,
  };
};
