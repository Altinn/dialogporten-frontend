import { type AccountListItemProps, Section } from '@altinn/altinn-components';
import { AccountList } from '@altinn/altinn-components';
import { useTranslation } from 'react-i18next';

export const AccountListSkeleton = ({ title }: { title?: string }) => {
  const { t } = useTranslation();
  const loadingItems: AccountListItemProps[] = Array.from({ length: 3 }, (_, index) => ({
    id: `loading-${index}`,
    name: t('parties.loading'),
    type: 'company',
    groupId: 'loading',
    interactive: false,
    loading: true,
    title: 'is loading, nothing here',
  }));

  const loadingGroups = {
    loading: {
      title: title ?? t('parties.loading'),
    },
  };

  return (
    <Section spacing={6}>
      <AccountList items={loadingItems} groups={loadingGroups} />
    </Section>
  );
};
