import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ApplicationList } from './pages/ApplicationList';
import { NewApplication } from './pages/NewApplication';
import { ApplicationDetail } from './pages/ApplicationDetail';
import { VerificationCentre } from './pages/VerificationCentre';
import { RulesAdmin } from './pages/RulesAdmin';
import { AuditTrail } from './pages/AuditTrail';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600 text-sm font-medium">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mr-3"></div>
        <span>Loading portal...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="applications" element={<ApplicationList />} />
            <Route path="applications/new" element={<NewApplication />} />
            <Route path="applications/:applicationId" element={<ApplicationDetail />} />
            <Route path="verification" element={<VerificationCentre />} />
            <Route path="admin/rules" element={<RulesAdmin />} />
            <Route path="audit" element={<AuditTrail />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
