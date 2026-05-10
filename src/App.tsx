import { Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Layout from '@/components/Layout';
import { AppAuthProvider } from '@/lib/auth';
import Index from './pages/Index';
import AgentPage from './pages/AgentPage';
import JobsPage from './pages/JobsPage';
import PostGigPage from './pages/PostGigPage';
import ProfilePage from './pages/ProfilePage';
import NotFound from './pages/NotFound';

const App = () => {
  return (
    <AppAuthProvider>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route
          path="/agent"
          element={
            <Layout showFooter={false}>
              <AgentPage />
            </Layout>
          }
        />
        <Route
          path="/jobs"
          element={
            <Layout>
              <JobsPage />
            </Layout>
          }
        />
        <Route
          path="/post"
          element={
            <Layout>
              <PostGigPage />
            </Layout>
          }
        />
        <Route
          path="/profile"
          element={
            <Layout>
              <ProfilePage />
            </Layout>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </AppAuthProvider>
  );
};

export default App;
