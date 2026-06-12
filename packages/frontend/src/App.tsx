import React, { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ErrorResetHandler, withErrorBoundary } from './components/ErrorBoundary/ErrorBoundary.tsx';
import { ProtectedPageLayout } from './components/PageLayout/PageLayout.tsx';
import { PageRoutes } from './pages/routes.ts';
import './app.css';
import { usePageTracking } from './hooks/usePageTracking.ts';

const Inbox = React.lazy(() => import('./pages/Inbox').then((m) => ({ default: m.Inbox })));
const DialogDetailsPage = React.lazy(() =>
  import('./pages/DialogDetailsPage').then((m) => ({ default: m.DialogDetailsPage })),
);
const Profile = React.lazy(() => import('./pages/Profile/Profile.tsx').then((m) => ({ default: m.Profile })));
const PartiesOverviewPage = React.lazy(() =>
  import('./pages/Profile/PartiesOverviewPage/PartiesOverviewPage.tsx').then((m) => ({
    default: m.PartiesOverviewPage,
  })),
);
const NotificationsPage = React.lazy(() =>
  import('./pages/Profile/NotificationsPage/NotificationsPage.tsx').then((m) => ({ default: m.NotificationsPage })),
);
const SavedSearchesPage = React.lazy(() =>
  import('./pages/SavedSearches').then((m) => ({ default: m.SavedSearchesPage })),
);
const RedirectPage = React.lazy(() =>
  import('./pages/RedirectPage/RedirectPage.tsx').then((m) => ({ default: m.RedirectPage })),
);
const ErrorPage = React.lazy(() => import('./pages/Error/Error.tsx').then((m) => ({ default: m.ErrorPage })));
const FrontChannelLogout = React.lazy(() =>
  import('./pages/LogoutPage/FrontChannelLogout.tsx').then((m) => ({ default: m.FrontChannelLogout })),
);

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
          <Route path={PageRoutes.redirect} element={<RedirectPage />} />
          <Route path={PageRoutes.error} element={<ErrorPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
        <Route
          path="/logout"
          element={
            <Suspense>
              <FrontChannelLogout />
            </Suspense>
          }
        />
      </Routes>
      <ErrorResetHandler />
    </div>
  );
}

export default App;
