import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LuCircleAlert, LuCircleCheck } from 'react-icons/lu';
import DemoWorkspace from './components/DemoWorkspace.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ProtectedRoute from './utils/ProtectedRoute.jsx';
import ProjectsPage from './pages/ProjectsPage.jsx';
import CalendarPage from './pages/CalendarPage.jsx';
import NotesPage from './pages/NotesPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import TaskList from './components/TaskList.jsx';
import DeliveryControlTowerPage from './pages/DeliveryControlTowerPage.jsx';
import ImpactSimulatorPage from './pages/ImpactSimulatorPage.jsx';
import NotificationSettingsPage from './pages/NotificationSettingsPage.jsx';

function App() {
  const protectedPage = (page) => <ProtectedRoute demo={<DemoWorkspace />}>{page}</ProtectedRoute>;

  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={protectedPage(<HomePage />)} />
            <Route path="/tasks" element={protectedPage(<TaskList />)} />
            <Route path="/projects" element={protectedPage(<ProjectsPage />)} />
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
