import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'risk_analyst' | 'auditor')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bgPrimary text-textPrimary">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-t-borderActive border-borderColor rounded-full animate-spin"></div>
          <span className="text-textSecondary font-sans">Loading session details...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    // Redirect to login page and preserve requested location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If authenticated but role is restricted
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-bgPrimary text-textPrimary p-6 text-center">
        <h1 className="text-display text-4xl text-danger font-bold mb-4">403: Forbidden</h1>
        <p className="text-textSecondary max-w-md mb-6">
          Your account role ({user.role}) is unauthorized to view this resource. Contact your system administrator to request access.
        </p>
        <button
          onClick={() => window.history.back()}
          className="px-6 py-2 bg-bgSecondary border border-borderColor rounded-lg hover:border-borderActive transition-all duration-300"
        >
          Go Back
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
