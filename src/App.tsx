import { AnimatePresence, motion } from 'framer-motion';
import { Routes, Route, useLocation } from 'react-router-dom';
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
  const location = useLocation();

  return (
    <AppAuthProvider>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          <Routes location={location}>
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
        </motion.div>
      </AnimatePresence>
      <Toaster />
    </AppAuthProvider>
  );
};

export default App;
