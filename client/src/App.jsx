import React, { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LuCircleAlert, LuCircleCheck } from 'react-icons/lu';
import { AuthProvider } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './utils/ProtectedRoute.jsx';

const DemoWorkspace = lazy(() => import('./components/DemoWorkspace.jsx'));
const LandingPage = lazy(() => import('./pages/LandingPage.jsx'));
const HomePage = lazy(() => import('./pages/HomePage.jsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage.jsx'));
const CalendarPage = lazy(() => import('./pages/CalendarPage.jsx'));
const NotesPage = lazy(() => import('./pages/NotesPage.jsx'));
const ReportsPage = lazy(() => import('./pages/ReportsPage.jsx'));
const TaskList = lazy(() => import('./components/TaskList.jsx'));
const DeliveryControlTowerPage = lazy(() => import('./pages/DeliveryControlTowerPage.jsx'));
const ImpactSimulatorPage = lazy(() => import('./pages/ImpactSimulatorPage.jsx'));
const NotificationSettingsPage = lazy(() => import('./pages/NotificationSettingsPage.jsx'));
const ProjectChatPage = lazy(() => import('./pages/ProjectChatPage.jsx'));

const RouteLoadingState = () => (
  <div className="flex min-h-48 items-center justify-center" role="status" aria-live="polite">
    <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-orange-200 border-t-orange-700" />
      Opening your workspace...
    </div>
  </div>
);

const ApiLatencyNotice = () => {
  const [slowRequests, setSlowRequests] = useState(() => new Set());

  useEffect(() => {
    const handleSlowRequest = (event) => {
      if (!event.detail?.id) return;
      setSlowRequests((current) => new Set(current).add(event.detail.id));
    };
    const handleSettledRequest = (event) => {
      if (!event.detail?.id) return;
      setSlowRequests((current) => {
        if (!current.has(event.detail.id)) return current;
        const next = new Set(current);
        next.delete(event.detail.id);
        return next;
      });
    };
    window.addEventListener('taskflow:api-request-slow', handleSlowRequest);
    window.addEventListener('taskflow:api-request-settled', handleSettledRequest);
    return () => {
      window.removeEventListener('taskflow:api-request-slow', handleSlowRequest);
      window.removeEventListener('taskflow:api-request-settled', handleSettledRequest);
    };
  }, []);

  if (!slowRequests.size) return null;
  return (
    <div className="fixed bottom-4 left-1/2 z-[100] flex w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 rounded-xl border border-orange-200 bg-white/95 px-4 py-3 text-sm text-slate-700 shadow-lg shadow-slate-900/10 backdrop-blur" role="status" aria-live="polite">
      <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-orange-200 border-t-orange-700" />
      <span>Waking up the server... this can take a few seconds on free plans</span>
    </div>
  );
};

function App() {
  const protectedPage = (page) => <ProtectedRoute demo={<DemoWorkspace />}>{page}</ProtectedRoute>;

  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Suspense fallback={<RouteLoadingState />}>
            <Routes>
              <Route path="/" element={<ProtectedRoute demo={<LandingPage />}><HomePage /></ProtectedRoute>} />
              <Route path="/tasks" element={protectedPage(<TaskList />)} />
              <Route path="/projects" element={protectedPage(<ProjectsPage />)} />
              <Route path="/projects/:projectId/chat" element={protectedPage(<ProjectChatPage />)} />
              <Route path="/calendar" element={protectedPage(<CalendarPage />)} />
              <Route path="/notes" element={protectedPage(<NotesPage />)} />
              <Route path="/reports" element={protectedPage(<ReportsPage />)} />
              <Route path="/control-tower" element={protectedPage(<DeliveryControlTowerPage />)} />
              <Route path="/impact-simulator" element={protectedPage(<ImpactSimulatorPage />)} />
              <Route path="/notifications" element={protectedPage(<NotificationSettingsPage />)} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                color: '#0f172a',
              },
              success: {
                iconTheme: {
                  primary: '#c2410c',
                  secondary: '#fff',
                },
                icon: <LuCircleCheck aria-hidden="true" className="h-5 w-5" />,
              },
              error: {
                iconTheme: {
                  primary: '#dc2626',
                  secondary: '#fff',
                },
                icon: <LuCircleAlert aria-hidden="true" className="h-5 w-5 text-red-600" />,
              },
            }}
          />
        </Layout>
        <ApiLatencyNotice />
      </Router>
    </AuthProvider>
  );
}

export default App;
