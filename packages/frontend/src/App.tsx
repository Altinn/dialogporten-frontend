import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedPageLayout } from './components/PageLayout/PageLayout.tsx';
import { DialogDetailsPage } from './pages/DialogDetailsPage';
import { Inbox } from './pages/Inbox';
import { LoggedOut } from './pages/LogoutPage';
import { Access } from './pages/Profile/Access/Access.tsx';
import { Activities } from './pages/Profile/Activities/Activities.tsx';
import { Authorize } from './pages/Profile/Authorize/Authorize.tsx';
import { Notifications } from './pages/Profile/Notifications/Notifications.tsx';
import { Profile } from './pages/Profile/Profile.tsx';
import { Settings } from './pages/Profile/Settings/Settings.tsx';
import { SavedSearchesPage } from './pages/SavedSearches';
import { PageRoutes } from './pages/routes.ts';
import './app.css';
import { FrontChannelLogout } from './pages/LogoutPage/FrontChannelLogout.tsx';
import { PartiesOverviewPage } from './pages/Profile/Actors/PartiesOverviewPage.tsx';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route element={<ProtectedPageLayout />}>
          <Route path={PageRoutes.inbox} element={<Inbox key="inbox" viewType={'inbox'} />} />
          <Route path={PageRoutes.partiesOverview} element={<PartiesOverviewPage key="partys" />} />
          <Route path={PageRoutes.drafts} element={<Inbox key="draft" viewType={'drafts'} />} />
          <Route path={PageRoutes.sent} element={<Inbox key="sent" viewType={'sent'} />} />
          <Route path={PageRoutes.archive} element={<Inbox key="archive" viewType={'archive'} />} />
          <Route path={PageRoutes.bin} element={<Inbox key="bin" viewType={'bin'} />} />
          <Route path={PageRoutes.inboxItem} element={<DialogDetailsPage />} />
          <Route path={PageRoutes.savedSearches} element={<SavedSearchesPage />} />
          <Route path={PageRoutes.profile} element={<Profile />} />
          <Route path={PageRoutes.authorize} element={<Authorize />} />
          <Route path={PageRoutes.access} element={<Access />} />
          <Route path={PageRoutes.notifications} element={<Notifications />} />
          <Route path={PageRoutes.settings} element={<Settings />} />
          <Route path={PageRoutes.activities} element={<Activities />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
        <Route path="/loggedout" element={<LoggedOut />} />
        <Route path="/logout" element={<FrontChannelLogout />} />
      </Routes>
    </div>
  );
}

export default App;
