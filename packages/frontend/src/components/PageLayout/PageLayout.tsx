import { Leva, button, useControls } from 'leva';
import React, { memo, useEffect } from 'react';
import { useQueryClient } from 'react-query';
import { Outlet, useLocation } from 'react-router-dom';
import { Footer, Header, Sidebar } from '..';
import { fetchHelloWorld, fetchProfile } from '../../api/queries.ts';
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
    const { selectedItemCount } = useSelectedDialogs();

    return (
      <div className={styles.pageLayout}>
        <Header name={name} companyName={companyName} notificationCount={notificationCount} />
        {selectedItemCount === 0 && <Sidebar isCompany={isCompany} />}
        <Outlet />
        <Footer />
      </div>
    );
  },
);

export const PageLayout: React.FC = () => {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const debug = urlParams.get('debug') === 'true';
  const { parties, selectedParties } = useParties();
  const name = parties.find((party) => party.partyType === 'Person')?.name || '';
  const { dialogsByView } = useDialogs(parties);
  const dialogs = dialogsByView['inbox'];
  const notificationCount = dialogs.length;

  const { isCompany: isCompanyControl } = useControls({
    isCompany: false,
    helloWorld: button(async () => {
      const response = await fetchHelloWorld();
      console.log(response);
    }),
    fetchBtn: button(async () => {
      const profile = await fetchProfile();
      console.log(profile);
    }),
  });

  const isCompany = isCompanyControl || selectedParties?.some((party) => party.partyType === 'Organization');
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
      </BottomDrawerContainer>
      <Snackbar />
      <Leva hidden={!debug} />
    </div>
  );
};
