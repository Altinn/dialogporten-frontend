import { type Color, type GlobalHeaderProps, Layout, type Size, Snackbar } from '@altinn/altinn-components';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useParties } from '../../api/hooks/useParties.ts';
import { useAuth } from '../../components/Login/AuthContext.tsx';
import { useFooter } from '../../components/PageLayout/Footer/useFooter.ts';
import { useHeaderConfig } from '../../components/PageLayout/useHeaderConfig.tsx';

const AuthenticatedLayout = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation();
  const { headerProps } = useHeaderConfig();
  const footer = useFooter();
  const { partyGraph, setSelectedPartyIds, selectedProfile } = useParties();
  const { accountSelector } = headerProps;

  const selectAccount = (accountUuid: string) => {
    const party = partyGraph.partyByUuid.get(accountUuid);
    if (party) {
      setSelectedPartyIds([party.party], null);
    }
  };

  const header: GlobalHeaderProps = accountSelector
    ? {
        ...headerProps,
        accountSelector: {
          ...accountSelector,
          accountMenu: { ...accountSelector.accountMenu, onSelectAccount: selectAccount },
        },
      }
    : headerProps;

  return (
    <Layout
      theme="subtle"
      color={selectedProfile === 'company' ? 'company' : 'person'}
      header={header}
      footer={footer}
      skipLink={{
        href: '#main-content',
        color: 'inherit' as Color,
        size: 'xs' as Size,
        children: t('skip_link.jumpto'),
      }}
    >
      {children}
      <Snackbar />
    </Layout>
  );
};

export const DialogBuilderLayout = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <AuthenticatedLayout>{children}</AuthenticatedLayout> : null;
};
