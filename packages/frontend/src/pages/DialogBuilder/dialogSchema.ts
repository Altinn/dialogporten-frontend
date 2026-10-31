import { z } from 'zod';
import { UNAUTHORIZED_URL } from '../../constants/sentinelUrls.ts';

export const LANGUAGES = ['nb', 'nn', 'en'] as const;
export const SERVICE_RESOURCE_TYPES = ['correspondenceservice', 'genericaccessresource', 'altinnapp'] as const;
export const DIALOG_STATUSES = [
  'NotApplicable',
  'InProgress',
  'Draft',
  'Awaiting',
  'RequiresAttention',
  'Completed',
] as const;
export const SYSTEM_LABELS = ['Default', 'Archive', 'Bin'] as const;
export const GUI_ACTION_PRIORITIES = ['Primary', 'Secondary', 'Tertiary'] as const;
export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS', 'TRACE', 'CONNECT'] as const;
export const ACTOR_TYPES = ['ServiceOwner', 'PartyRepresentative'] as const;
export const ACTIVITY_TYPES = [
  'DialogCreated',
  'DialogClosed',
  'Information',
  'TransmissionOpened',
  'PaymentMade',
  'SignatureProvided',
  'DialogOpened',
  'DialogDeleted',
  'DialogRestored',
  'SentToSigning',
  'SentToFormFill',
  'SentToSendIn',
  'SentToPayment',
  'FormSubmitted',
  'FormSaved',
  'CorrespondenceOpened',
  'CorrespondenceConfirmed',
] as const;
export const TRANSMISSION_TYPES = [
  'Information',
  'Acceptance',
  'Rejection',
  'Request',
  'Alert',
  'Decision',
  'Submission',
  'Correction',
] as const;
export const ADDITIONAL_INFO_MEDIA_TYPES = ['text/plain', 'text/markdown'] as const;
export const EMBED_MEDIA_TYPES = [
  'application/vnd.dialogporten.frontchannelembed-url;type=text/markdown',
  'application/vnd.dialogporten.frontchannelembed-url;type=text/html',
] as const;

const MAX_GUI_ACTIONS_BY_PRIORITY: Record<(typeof GUI_ACTION_PRIORITIES)[number], number> = {
  Primary: 1,
  Secondary: 1,
  Tertiary: 5,
};

export const isHttpsUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
};

const httpsUrl = z
  .string()
  .refine((value) => isHttpsUrl(value) || value === UNAUTHORIZED_URL, { error: 'Må være en gyldig https-URL.' });
const dateTime = z.string().refine((value) => !Number.isNaN(Date.parse(value)), { error: 'Må være en gyldig dato.' });
const id = z.string().nullish();
const authorizationContext = z.unknown().optional();

const localization = z.strictObject({ languageCode: z.string().min(2), value: z.string().min(1) });
const localizations = z.array(localization).min(1);
const embedLocalizations = z.array(z.strictObject({ languageCode: z.string().min(2), value: httpsUrl })).min(1);

const plainTextContent = z.strictObject({
  value: localizations,
  mediaType: z.literal('text/plain').optional(),
  isAuthorized: z.boolean().nullish(),
});

const embedContent = z.strictObject({
  value: embedLocalizations,
  mediaType: z.enum(EMBED_MEDIA_TYPES),
  isAuthorized: z.boolean().nullish(),
});

const actor = z.strictObject({
  actorType: z.enum(ACTOR_TYPES),
  actorId: z.string().nullish(),
  actorName: z.string().nullish(),
});

const attachmentUrl = z.strictObject({
  id,
  url: httpsUrl,
  mediaType: z.string().nullish(),
  consumerType: z.enum(['Gui', 'Api']),
});

const attachment = z.strictObject({
  id,
  name: z.string().nullish(),
  displayName: localizations,
  urls: z.array(attachmentUrl).min(1),
  expiresAt: dateTime.nullish(),
  authorizationContext,
});

const guiAction = z.strictObject({
  id,
  action: z.string().min(1),
  url: httpsUrl,
  authorizationAttribute: z.string().nullish(),
  authorizationContext,
  isDeleteDialogAction: z.boolean().optional(),
  httpMethod: z.enum(HTTP_METHODS).nullish(),
  priority: z.enum(GUI_ACTION_PRIORITIES),
  title: localizations,
  prompt: localizations.nullish(),
});

const activity = z.strictObject({
  id,
  createdAt: dateTime.nullish(),
  extendedType: z.string().nullish(),
  type: z.enum(ACTIVITY_TYPES),
  performedBy: actor,
  description: localizations.nullish(),
  transmissionId: z.string().nullish(),
  authorizationContext,
});

const navigationalAction = z.strictObject({
  id,
  title: localizations,
  url: httpsUrl,
  expiresAt: dateTime.nullish(),
  authorizationContext,
});

const transmission = z.strictObject({
  id,
  createdAt: dateTime.nullish(),
  extendedType: z.string().nullish(),
  externalReference: z.string().nullish(),
  idempotentKey: z.string().nullish(),
  authorizationAttribute: z.string().nullish(),
  authorizationContext,
  relatedTransmissionId: z.string().nullish(),
  type: z.enum(TRANSMISSION_TYPES),
  sender: actor,
  content: z.strictObject({
    title: plainTextContent,
    summary: plainTextContent.nullish(),
    contentReference: embedContent.nullish(),
  }),
  attachments: z.array(attachment).nullish(),
  navigationalActions: z.array(navigationalAction).nullish(),
});

const content = z.strictObject({
  title: plainTextContent,
  summary: plainTextContent.nullish(),
  senderName: plainTextContent.nullish(),
  extendedStatus: plainTextContent.nullish(),
  nonSensitiveTitle: plainTextContent.nullish(),
  nonSensitiveSummary: plainTextContent.nullish(),
  additionalInfo: z
    .strictObject({
      value: localizations,
      mediaType: z.enum(ADDITIONAL_INFO_MEDIA_TYPES).optional(),
      isAuthorized: z.boolean().nullish(),
    })
    .nullish(),
  mainContentReference: embedContent.nullish(),
});

export const previewDialogSchema = z.strictObject({
  id,
  idempotentKey: z.string().nullish(),
  serviceResource: z.string().startsWith('urn:altinn:resource:', { error: 'Må starte med urn:altinn:resource:' }),
  isApiOnly: z.boolean().optional(),
  status: z.enum([...DIALOG_STATUSES, 'New', 'Sent']).nullish(),
  systemLabel: z.enum(SYSTEM_LABELS).nullish(),
  extendedStatus: z.string().nullish(),
  externalReference: z.string().nullish(),
  progress: z.number().int().min(0).max(100).nullish(),
  process: z.string().nullish(),
  precedingProcess: z.string().nullish(),
  createdAt: dateTime.nullish(),
  updatedAt: dateTime.nullish(),
  dueAt: dateTime.nullish(),
  visibleFrom: dateTime.nullish(),
  expiresAt: dateTime.nullish(),
  content,
  attachments: z.array(attachment).nullish(),
  guiActions: z.array(guiAction).nullish(),
  apiActions: z.array(z.unknown()).nullish(),
  activities: z.array(activity).nullish(),
  transmissions: z.array(transmission).nullish(),
  searchTags: z.array(z.unknown()).nullish(),
  serviceOwnerContext: z.unknown().optional(),
});

export const createDialogSchema = previewDialogSchema.extend({
  party: z.string().startsWith('urn:altinn:', { error: 'Må være en URN som starter med urn:altinn:' }),
});

export type PreviewDialog = z.infer<typeof previewDialogSchema>;
export type CreateDialog = z.infer<typeof createDialogSchema>;
export type Language = (typeof LANGUAGES)[number];
export type ServiceResourceType = (typeof SERVICE_RESOURCE_TYPES)[number];
export type Localization = z.infer<typeof localization>;
export type Attachment = z.infer<typeof attachment>;
export type GuiAction = z.infer<typeof guiAction>;
export type Activity = z.infer<typeof activity>;
export type Transmission = z.infer<typeof transmission>;
export type NavigationalAction = z.infer<typeof navigationalAction>;
export type Actor = z.infer<typeof actor>;

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface ValidationResult<T> {
  dialog?: T;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

const REQUIRED_MESSAGE = 'Må fylles ut.';

const formatPath = (path: PropertyKey[]): string => path.map(String).join('.');

const toErrorMessage: z.core.$ZodErrorMap = (issue) =>
  issue.input === undefined ? REQUIRED_MESSAGE : z.locales.no().localeError(issue);

const checkDialogRules = (dialog: PreviewDialog): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];

  for (const priority of GUI_ACTION_PRIORITIES) {
    const count = dialog.guiActions?.filter((action) => action.priority === priority).length ?? 0;
    const max = MAX_GUI_ACTIONS_BY_PRIORITY[priority];
    if (count > max) {
      issues.push({ path: 'guiActions', message: `Maks ${max} handling(er) med prioritet ${priority}.` });
    }
  }

  const transmissionIds = new Set(dialog.transmissions?.map((transmission) => transmission.id));
  dialog.transmissions?.forEach(({ relatedTransmissionId }, index) => {
    if (relatedTransmissionId && !transmissionIds.has(relatedTransmissionId)) {
      issues.push({
        path: `transmissions.${index}.relatedTransmissionId`,
        message: 'Må peke på en forsendelse i dialogen.',
      });
    }
  });

  dialog.activities?.forEach(({ transmissionId, type, description }, index) => {
    if (transmissionId && !transmissionIds.has(transmissionId)) {
      issues.push({ path: `activities.${index}.transmissionId`, message: 'Må peke på en forsendelse i dialogen.' });
    }
    if (description?.length && type !== 'Information') {
      issues.push({ path: `activities.${index}.description`, message: 'Kan bare settes på type Information.' });
    }
  });

  return issues;
};

const validate = <T extends PreviewDialog>(schema: z.ZodType<T>, input: unknown): ValidationResult<T> => {
  const result = schema.safeParse(input, { error: toErrorMessage });
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  for (const issue of result.error?.issues ?? []) {
    if (issue.code === 'unrecognized_keys') {
      for (const key of issue.keys) {
        warnings.push({
          path: formatPath([...issue.path, key]),
          message: 'Ukjent felt, ignoreres i forhåndsvisningen.',
        });
      }
    } else {
      errors.push({ path: formatPath(issue.path), message: issue.message });
    }
  }

  if (errors.length > 0) {
    return { errors, warnings };
  }

  const dialog = input as T;
  const ruleErrors = checkDialogRules(dialog);
  return ruleErrors.length > 0 ? { errors: ruleErrors, warnings } : { dialog, errors: [], warnings };
};

export const validateCreateDialog = (input: unknown): ValidationResult<CreateDialog> =>
  validate(createDialogSchema, input);

export const validatePreviewDialog = (input: unknown): ValidationResult<PreviewDialog> =>
  validate(previewDialogSchema, input);

export const parseDialogJson = (text: string): { json?: unknown; error?: string } => {
  try {
    return { json: JSON.parse(text) };
  } catch (error) {
    return { error: (error as Error).message };
  }
};
