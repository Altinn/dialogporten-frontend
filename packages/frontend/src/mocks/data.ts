import type {
  OrganizationFieldsFragment,
  PartyFieldsFragment,
  Profile,
  SavedSearchesFieldsFragment,
  SearchDialogFieldsFragment,
  ServiceResource,
} from 'bff-types-generated';
import { dialogs as mockedDialogs } from './data/base/dialogs.ts';
import { features as mockedFeatures } from './data/base/features.ts';
import { parties as mockedParties } from './data/base/parties.ts';
import { profile as mockedProfile } from './data/base/profile.ts';
import { services as mockedServices } from './data/base/services.ts';

const findDataById = async <T>(
  url: string,
  type: 'profile' | 'parties' | 'dialogs' | 'features' | 'searches' | 'services',
  defaultData: T,
): Promise<T> => {
  const urlParams = new URLSearchParams(url);
  const playwrightId = urlParams.get('playwrightId');
  try {
    const data = await import(`./data/stories/${playwrightId}/${type}.ts`);
    return data[type];
  } catch {
    return defaultData;
  }
};

const findProfileById = (url: string) => findDataById<Profile>(url, 'profile', mockedProfile);
const findFeaturesById = (url: string) => findDataById<Record<string, boolean>>(url, 'features', mockedFeatures);
const findPartiesById = (url: string) => findDataById<PartyFieldsFragment[]>(url, 'parties', mockedParties);
const findDialogsById = (url: string) => findDataById<SearchDialogFieldsFragment[]>(url, 'dialogs', mockedDialogs);
const findSavedSearchesById = (url: string) => findDataById<SavedSearchesFieldsFragment[]>(url, 'searches', []);
const findServicesById = (url: string) => findDataById<ServiceResource[]>(url, 'services', mockedServices);

export const getMockedData = async (
  url: string,
): Promise<{
  profile: Profile;
  dialogs: SearchDialogFieldsFragment[];
  parties: PartyFieldsFragment[];
  savedSearches: SavedSearchesFieldsFragment[];
  organizations: OrganizationFieldsFragment[];
  features: Record<string, boolean>;
  services: ServiceResource[];
}> => {
  const profile = await findProfileById(url);
  const features = await findFeaturesById(url);
  const parties = await findPartiesById(url);
  const dialogs = await findDialogsById(url);
  const savedSearches = await findSavedSearchesById(url);
  const services = await findServicesById(url);
  const { organizations } = await import('./data/base/organizations.ts');

  return { profile, dialogs, parties, savedSearches, organizations, features, services };
};
