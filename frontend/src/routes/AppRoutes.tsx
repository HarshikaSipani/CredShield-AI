import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import ProtectedRoute from './ProtectedRoute';

// Lazy load feature pages for optimal performance
import LoginPage from '../features/auth/pages/LoginPage';
import AnalyticsDashboard from '../features/analytics/pages/AnalyticsDashboard';
import ScoringWorkbench from '../features/predictions/pages/ScoringWorkbench';
import ApplicantsDirectory from '../features/applicants/pages/ApplicantsDirectory';
import ModelPerformancePage from '../features/analytics/pages/ModelPerformancePage';
import AdminDashboard from '../features/admin/pages/AdminDashboard';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Authentication Layout Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Main Authenticated Dashboard Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AnalyticsDashboard />} />
        <Route 
          path="evaluate" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'risk_analyst']}>
              <ScoringWorkbench />
            </ProtectedRoute>
          } 
        />
        <Route path="applicants" element={<ApplicantsDirectory />} />
        <Route path="model-health" element={<ModelPerformancePage />} />
        <Route 
          path="admin" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
      </Route>

      {/* Fallback Catch-All Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
