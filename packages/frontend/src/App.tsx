import { Navigate, Route, Routes } from 'react-router-dom';
import { ErrorResetHandler, withErrorBoundary } from './components/ErrorBoundary/ErrorBoundary.tsx';
import { ProtectedPageLayout } from './components/PageLayout/PageLayout.tsx';
import { DialogDetailsPage } from './pages/DialogDetailsPage';
import { ErrorPage } from './pages/Error/Error.tsx';
import { Inbox } from './pages/Inbox';
import { FrontChannelLogout } from './pages/LogoutPage/FrontChannelLogout.tsx';
import { Access } from './pages/Profile/Access/Access.tsx';
import { Activities } from './pages/Profile/Activities/Activities.tsx';
import { Authorize } from './pages/Profile/Authorize/Authorize.tsx';
import { NotificationsPage } from './pages/Profile/NotificationsPage/NotificationsPage.tsx';
import { PartiesOverviewPage } from './pages/Profile/PartiesOverviewPage/PartiesOverviewPage.tsx';
import { Profile } from './pages/Profile/Profile.tsx';
import { Settings } from './pages/Profile/Settings/Settings.tsx';
import { SavedSearchesPage } from './pages/SavedSearches';
import { PageRoutes } from './pages/routes.ts';
import './app.css';
import { usePageTracking } from './hooks/usePageTracking.ts';
import { AboutPage } from './pages/About/About.tsx';

function App() {
  // Add page tracking
  usePageTracking();

  return (
    <div className="app">
      <Routes>
        <Route element={<ProtectedPageLayout />}>
          <Route
            path={PageRoutes.inbox}
            element={withErrorBoundary(<Inbox key="inbox" viewType={'inbox'} />, 'Inbox')}
          />
          <Route path={PageRoutes.profile} element={withErrorBoundary(<Profile />, 'Profile')} />
          <Route
            path={PageRoutes.partiesOverview}
            element={withErrorBoundary(<PartiesOverviewPage key="partys" />, 'Parties Overview')}
          />
          <Route path={PageRoutes.notifications} element={withErrorBoundary(<NotificationsPage />, 'Notifications')} />
          <Route path={PageRoutes.settings} element={withErrorBoundary(<Settings />, 'Settings')} />
          <Route path={PageRoutes.access} element={withErrorBoundary(<Access />, 'Access')} />
          <Route path={PageRoutes.activities} element={withErrorBoundary(<Activities />, 'Activities')} />
          <Route path={PageRoutes.authorize} element={withErrorBoundary(<Authorize />, 'Authorize')} />

          <Route
            path={PageRoutes.drafts}
            element={withErrorBoundary(<Inbox key="draft" viewType={'drafts'} />, 'Drafts')}
          />
          <Route path={PageRoutes.sent} element={withErrorBoundary(<Inbox key="sent" viewType={'sent'} />, 'Sent')} />
          <Route
            path={PageRoutes.archive}
            element={withErrorBoundary(<Inbox key="archive" viewType={'archive'} />, 'Archive')}
          />
          <Route path={PageRoutes.bin} element={withErrorBoundary(<Inbox key="bin" viewType={'bin'} />, 'Bin')} />
          <Route path={PageRoutes.inboxItem} element={withErrorBoundary(<DialogDetailsPage />, 'Inbox Item')} />
          <Route path={PageRoutes.savedSearches} element={withErrorBoundary(<SavedSearchesPage />, 'Saved Searches')} />

          <Route path={PageRoutes.about} element={withErrorBoundary(<AboutPage />, 'About')} />
          <Route path={PageRoutes.error} element={<ErrorPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
        <Route path="/logout" element={<FrontChannelLogout />} />
      </Routes>
      <ErrorResetHandler />
    </div>
  );
}

export default App;
