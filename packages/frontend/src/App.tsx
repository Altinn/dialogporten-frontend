import { Navigate, Route, Routes } from 'react-router-dom';
import { withErrorBoundary } from './components/ErrorBoundary/ErrorBoundary.tsx';
import { ProtectedPageLayout } from './components/PageLayout/PageLayout.tsx';
import { DialogDetailsPage } from './pages/DialogDetailsPage';
import { Inbox } from './pages/Inbox';
import { LoggedOut } from './pages/LogoutPage';
import { Activities } from './pages/Profile/Activities/Activities.tsx';
import { Actors } from './pages/Profile/Actors/Actors.tsx';
import { Notifications } from './pages/Profile/Notifications/Notifications.tsx';
import { Profile } from './pages/Profile/Profile.tsx';
import { Settings } from './pages/Profile/Settings/Settings.tsx';
import { SavedSearchesPage } from './pages/SavedSearches';
import { PageRoutes } from './pages/routes.ts';

import './app.css';
import { FrontChannelLogout } from './pages/LogoutPage/FrontChannelLogout.tsx';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route element={<ProtectedPageLayout />}>
          <Route path={PageRoutes.inbox} element={withErrorBoundary(<Inbox key="inbox" viewType={'inbox'} />)} />
          <Route path={PageRoutes.actors} element={withErrorBoundary(<Actors key="actors" />)} />
          <Route path={PageRoutes.drafts} element={withErrorBoundary(<Inbox key="draft" viewType={'drafts'} />)} />
          <Route path={PageRoutes.sent} element={withErrorBoundary(<Inbox key="sent" viewType={'sent'} />)} />
          <Route path={PageRoutes.archive} element={withErrorBoundary(<Inbox key="archive" viewType={'archive'} />)} />
          <Route path={PageRoutes.bin} element={withErrorBoundary(<Inbox key="bin" viewType={'bin'} />)} />
          <Route path={PageRoutes.inboxItem} element={withErrorBoundary(<DialogDetailsPage />)} />
          <Route path={PageRoutes.savedSearches} element={withErrorBoundary(<SavedSearchesPage />)} />
          <Route path={PageRoutes.profile} element={withErrorBoundary(<Profile />)} />
          <Route path={PageRoutes.actors} element={withErrorBoundary(<Actors />)} />
          <Route path={PageRoutes.notifications} element={withErrorBoundary(<Notifications />)} />
          <Route path={PageRoutes.settings} element={withErrorBoundary(<Settings />)} />
          <Route path={PageRoutes.activities} element={withErrorBoundary(<Activities />)} />
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
        <Route path="/loggedout" element={<LoggedOut />} />
        <Route path="/logout" element={<FrontChannelLogout />} />
      </Routes>
    </div>
  );
}

export default App;
