import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Mail, Lock, AlertCircle } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      // Redirect happens automatically inside AuthLayout when authenticated
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.detail || 
        "Authentication failed. Please verify your email and password credentials."
      );
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <h2 className="text-xl font-display font-semibold text-textPrimary text-center">
        Welcome Back
      </h2>

      {/* Render error alerts */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-danger/20 bg-danger/10 p-3.5 text-sm text-danger animate-shake">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Email Parameter Input */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-sans font-semibold text-textSecondary uppercase tracking-wider">
          Email Address
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-textMuted">
            <Mail size={18} />
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-bgTertiary border border-borderColor rounded-lg pl-10 pr-4 py-2.5 text-sm text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-borderActive transition-all duration-200"
            placeholder="analyst@bank.com"
          />
        </div>
      </div>

      {/* Password Parameter Input */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-sans font-semibold text-textSecondary uppercase tracking-wider">
            Password
          </label>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-textMuted">
            <Lock size={18} />
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-bgTertiary border border-borderColor rounded-lg pl-10 pr-4 py-2.5 text-sm text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-borderActive transition-all duration-200"
            placeholder="••••••••"
          />
        </div>
      </div>

      {/* Sign In Submit Trigger */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-br from-[#6366f1] to-[#4f46e5] hover:opacity-95 text-white font-sans font-semibold text-sm rounded-lg py-2.5 mt-2 transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-t-white border-white/20 rounded-full animate-spin"></div>
            <span>Signing In...</span>
          </div>
        ) : (
          "Sign In to AuraCredit"
        )}
      </button>

      <div className="text-center mt-2 text-xs text-textMuted font-sans">
        Default Analyst: <span className="text-textSecondary">analyst@credishield.com</span> / <span className="text-textSecondary">AnalystPassword123!</span>
      </div>
    </form>
  );
};

export default LoginPage;
