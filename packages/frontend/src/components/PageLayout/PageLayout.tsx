import React, { memo, useEffect } from 'react';
import { useQueryClient } from 'react-query';
import { Outlet, useLocation } from 'react-router-dom';
import { Footer, Header, Sidebar } from '..';
import { useDialogs } from '../../api/useDialogs.tsx';
import { useParties } from '../../api/useParties.ts';
import { useAuthenticated } from '../../auth';
import { getSearchStringFromQueryParams } from '../../pages/Inbox/Inbox';
import { BottomDrawerContainer } from '../BottomDrawer';
import { Snackbar } from '../Snackbar/Snackbar.tsx';
import { SelectedDialogsContainer, useSelectedDialogs } from './SelectedDialogs.tsx';
import styles from './pageLayout.module.css';

export const useUpdateOnLocationChange = (fn: () => void) => {
  const location = useLocation();
  useEffect(() => {
    fn();
  }, [location, fn]);
};

interface PageLayoutContentProps {
  name: string;
  isCompany: boolean;
  companyName?: string;
  notificationCount?: number;
}

const PageLayoutContent: React.FC<PageLayoutContentProps> = memo(
  ({ name, companyName, isCompany, notificationCount }) => {
    const { inSelectionMode } = useSelectedDialogs();

    return (
      <div className={styles.pageLayout}>
        <Header name={name} companyName={companyName} notificationCount={notificationCount} />
        {!inSelectionMode && <Sidebar isCompany={isCompany} />}
        <Outlet />
        <Footer />
      </div>
    );
  },
);

export const PageLayout: React.FC = () => {
  const queryClient = useQueryClient();
  const { parties, selectedParties } = useParties();
  const name = parties.find((party) => party.partyType === 'Person')?.name || '';
  const { dialogsByView } = useDialogs(parties);
  const dialogs = dialogsByView['inbox'];
  const notificationCount = dialogs.length;

  const isCompany = selectedParties?.some((party) => party.partyType === 'Organization');
  const companyName = selectedParties?.some((party) => party.partyType === 'Organization')
    ? selectedParties?.find((party) => party.partyType === 'Organization')?.name
    : '';

  useAuthenticated();
  useUpdateOnLocationChange(() => {
    const searchString = getSearchStringFromQueryParams();
    queryClient.setQueryData(['search'], () => searchString || '');
  });

  return (
    <div className={isCompany ? `isCompany` : ''}>
      <BottomDrawerContainer>
        <SelectedDialogsContainer>
          <PageLayoutContent
            name={name}
            companyName={companyName}
            isCompany={isCompany}
            notificationCount={notificationCount}
          />
        </SelectedDialogsContainer>
        <Snackbar />
      </BottomDrawerContainer>
    </div>
  );
};
