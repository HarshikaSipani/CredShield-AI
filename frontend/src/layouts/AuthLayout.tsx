import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AuthLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#090a0f] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-t-[#4a54ff] border-[#212534] rounded-full animate-spin"></div>
          <span className="text-gray-400 font-sans">Verifying security context...</span>
        </div>
      </div>
    );
  }

  // Redirect users to dashboard index if session is already active
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#090a0f] px-4 relative overflow-hidden">
      {/* Visual background gradient circles for Stripe/Linear styling */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#6366f1]/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[50%] rounded-full bg-[#4f46e5]/10 blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md glass-card rounded-2xl p-8 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#6366f1] to-[#4f46e5] text-white font-display font-extrabold text-2xl shadow-lg shadow-indigo-500/20 mb-4">
            C
          </div>
          <h1 className="font-display font-bold text-2xl text-white">
            CrediShield <span className="text-[#4a54ff]">AI</span>
          </h1>
          <p className="text-xs font-sans text-textSecondary mt-2">
            Enterprise Risk Management & Credit Scoring
          </p>
        </div>

        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
