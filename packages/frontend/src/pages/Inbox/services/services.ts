type LangCode = 'nb' | 'nn' | 'en' | 'nb-no' | 'nn-no' | (string & {});
export type LocalizedText = Partial<Record<LangCode, string>>;

export type ResourceType =
  | 'Altinn2Service'
  | 'AltinnApp'
  | 'MaskinportenSchema'
  | 'GenericAccessResource'
  | 'CorrespondenceService'
  | 'Systemresource'
  | 'Consent'
  | (string & {});

export type ResourceStatus = 'Active' | 'Completed' | 'UnderDevelopment' | 'Deprecated' | 'Withdrawn' | (string & {});

export type AccessListMode = 'Disabled' | 'Enabled' | (string & {});

export type ReferenceSource = 'Altinn2' | 'Altinn3' | 'ExternalPlatform' | 'Default' | (string & {});

export type ReferenceType =
  | 'DelegationSchemeId'
  | 'MaskinportenScope'
  | 'ServiceCode'
  | 'ServiceEditionCode'
  | 'ApplicationId'
  | 'Uri'
  | (string & {});

export interface ResourceReference {
  referenceSource: ReferenceSource;
  reference: string;
  referenceType: ReferenceType;
}

export interface ContactPoint {
  category?: string;
  email?: string;
  telephone?: string;
  contactPage?: string;
}

export interface CompetentAuthority {
  name: LocalizedText;
  organization?: string; // org number (often set, but not always)
  orgcode?: string; // note: casing varies in data (e.g. "TTD" vs "ttd")
}

export interface Keyword {
  word: string;
  language: string; // e.g. "nb"
}

export interface AuthorizationReference {
  id: string; // e.g. "urn:altinn:resource"
  value: string; // mirrors identifier
}

export interface BaseResource {
  identifier: string;
  version?: string | number;

  title: LocalizedText;
  description?: LocalizedText;
  rightDescription?: LocalizedText;

  homepage?: string;
  status?: ResourceStatus;

  contactPoints?: ContactPoint[];
  isPartOf?: string;

  resourceReferences?: ResourceReference[];

  delegable: boolean;
  visible: boolean;

  hasCompetentAuthority: CompetentAuthority;

  keywords?: Keyword[];

  accessListMode: AccessListMode;
  selfIdentifiedUserEnabled: boolean;
  enterpriseUserEnabled: boolean;

  resourceType: ResourceType;

  availableForType?: string[];

  authorizationReference: AuthorizationReference[];

  isOneTimeConsent: boolean;

  spatial?: unknown[];
  produces?: unknown[];
  thematicAreas?: unknown[];
}

export type ConsentMetadata = Record<string, { optional: boolean }>;

export interface ConsentResource extends Omit<BaseResource, 'resourceType'> {
  resourceType: 'Consent';
  consentTemplate: string;
  consentText: LocalizedText;
  consentMetadata?: ConsentMetadata;
}

export type Resource = BaseResource | ConsentResource;
