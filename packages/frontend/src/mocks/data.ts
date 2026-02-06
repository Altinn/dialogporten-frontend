import type {
  OrganizationFieldsFragment,
  PartyFieldsFragment,
  Profile,
  SavedSearchesFieldsFragment,
  SearchDialogFieldsFragment, ServiceResource,
} from 'bff-types-generated';
import { profile as mockedProfile } from './data/base/profile.ts';
import { dialogs as mockedDialogs } from './data/base/dialogs.ts';
import { parties as mockedParties } from './data/base/parties.ts';
import { features as mockedFeatures } from "./data/base/features.ts";

const findDataById = async <T>(url: string, type: 'profile' | 'parties' | 'dialogs' | 'features', defaultData: T): Promise<T> => {
  const urlParams = new URLSearchParams(url);
  const playwrightId = urlParams.get('playwrightId');
  try {
    const data = await import(`./data/stories/${playwrightId}/${type}.ts`);
    return data[type];
  } catch (error) {
    return defaultData;
  }
};

const findProfileById = (url: string) => findDataById<Profile>(url, 'profile', mockedProfile);
const findFeaturesById = (url: string) => findDataById<Record<string, boolean>>(url, 'features', mockedFeatures);
const findPartiesById = (url: string) => findDataById<PartyFieldsFragment[]>(url, 'parties', mockedParties);
const findDialogsById = (url: string) => findDataById<SearchDialogFieldsFragment[]>(url, 'dialogs', mockedDialogs);

export const getMockedData = async (
  url: string,
): Promise<{
  profile: Profile;
  dialogs: SearchDialogFieldsFragment[];
  parties: PartyFieldsFragment[];
  savedSearches: SavedSearchesFieldsFragment[];
  organizations: OrganizationFieldsFragment[];
  features: Record<string, boolean>
  services: ServiceResource[]
}> => {
  const profile = await findProfileById(url);
  const features = await findFeaturesById(url);
  const parties = await findPartiesById(url);
  const dialogs = await findDialogsById(url);
  const { organizations } = await import('./data/base/organizations.ts');
  const { services } = await import('./data/base/services.ts');

  return { profile, dialogs, parties, savedSearches: [], organizations, features, services };
};
