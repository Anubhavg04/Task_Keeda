import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';

const ProtectedRoute = ({ children, demo }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf8f4]">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500" role="status">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-orange-200 border-t-orange-700" />
          Loading your workspace...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return demo || <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
