import React, { lazy, Suspense} from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/react';
import Clarity from '@microsoft/clarity';
import { LuCircleAlert, LuCircleCheck } from 'react-icons/lu';
import { AuthProvider } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './utils/ProtectedRoute.jsx';

const clarityProjectId = import.meta.env.VITE_CLARITY_PROJECT_ID;
if (clarityProjectId) Clarity.init(clarityProjectId);

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

function App() {
  const protectedPage = (page) => <ProtectedRoute demo={<DemoWorkspace />}>{page}</ProtectedRoute>;

  return (
    <AuthProvider>
      <Router>
        <Analytics />
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
      </Router>
    </AuthProvider>
  );
}

export default App;
