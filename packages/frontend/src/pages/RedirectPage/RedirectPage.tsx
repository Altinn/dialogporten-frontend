import { DsSpinner, Flex, PageBase } from '@altinn/altinn-components';
import type { DialogLookupQuery } from 'bff-types-generated';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { graphQLSDK } from '../../api/queries.ts';
import { useAuthenticatedQuery } from '../../auth/useAuthenticatedQuery.tsx';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { PageRoutes } from '../routes.ts';

export const RedirectPage = () => {
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const instanceUrn = searchParams.get('instanceUrn');

  const { data, isError, isSuccess, isLoading } = useAuthenticatedQuery<DialogLookupQuery>({
    queryKey: [QUERY_KEYS.DIALOG_REDIRECT_LOOKUP, instanceUrn],
    queryFn: async () => graphQLSDK.dialogLookup({ instanceRef: instanceUrn! }),
    enabled: !!instanceUrn,
    retry: false,
  });

  useEffect(() => {
    if (!instanceUrn) {
      navigate(PageRoutes.inbox, { replace: true });
      return;
    }

    if (isError) {
      navigate(PageRoutes.inbox, { replace: true });
      return;
    }

    if (isSuccess) {
      const dialogId = data?.dialogLookup?.lookup?.dialogId;
      const hasErrors = data?.dialogLookup?.errors && data.dialogLookup.errors.length > 0;

      if (dialogId && !hasErrors) {
        navigate(`/inbox/${dialogId}`, { replace: true });
      } else {
        navigate(PageRoutes.inbox, { replace: true });
      }
    }
  }, [instanceUrn, isError, isSuccess, data, navigate]);

  return (
    <PageBase>
      <Flex direction="col" align="center" justify="center">
        {isLoading && <DsSpinner data-size="lg" aria-label={t('altinn.dialogporten.loading_lookup')} />}
      </Flex>
    </PageBase>
  );
};
