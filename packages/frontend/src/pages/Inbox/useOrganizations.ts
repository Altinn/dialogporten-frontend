import { useQuery } from '@tanstack/react-query';
import type { OrganizationFieldsFragment, OrganizationsQuery } from 'bff-types-generated';
import { fetchOrganizations } from '../../api/queries.ts';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';

interface UseOrganizationsOutput {
  organizations: OrganizationFieldsFragment[];
  isSuccess: boolean;
  isLoading: boolean;
}

export const useOrganizations = (): UseOrganizationsOutput => {
  const { data, isLoading, isSuccess } = useQuery<OrganizationsQuery>({
    queryKey: [QUERY_KEYS.ORGANIZATIONS],
    queryFn: fetchOrganizations,
    retry: 3,
    staleTime: 1000 * 60 * 20,
  });
  const organizations = data?.organizations as OrganizationFieldsFragment[] | [];

  return { organizations, isLoading, isSuccess };
};
