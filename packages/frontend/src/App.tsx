import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedPageLayout } from './components/PageLayout/PageLayout.tsx';
import { DialogDetailsPage } from './pages/DialogDetailsPage';
import { Inbox } from './pages/Inbox';
import { Logout } from './pages/LogoutPage';
import { SavedSearchesPage } from './pages/SavedSearches';
import { PageRoutes } from './pages/routes.ts';

import './app.css';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route element={<ProtectedPageLayout />}>
          <Route path={PageRoutes.inbox} element={<Inbox key="inbox" viewType={'inbox'} />} />
          <Route path={PageRoutes.drafts} element={<Inbox key="draft" viewType={'drafts'} />} />
          <Route path={PageRoutes.sent} element={<Inbox key="sent" viewType={'sent'} />} />
          <Route path={PageRoutes.archive} element={<Inbox key="archive" viewType={'archive'} />} />
          <Route path={PageRoutes.bin} element={<Inbox key="bin" viewType={'bin'} />} />
          <Route path={PageRoutes.inboxItem} element={<DialogDetailsPage />} />
          <Route path={PageRoutes.savedSearches} element={<SavedSearchesPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
        <Route path="/loggedout" element={<Logout />} />
      </Routes>
    </div>
  );
}

export default App;
