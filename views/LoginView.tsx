import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface LoginViewProps {
  onSwitchToRegister: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) throw error;
      // App.tsx handles the state update via onAuthStateChange
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="inline-block p-4 rounded-2xl bg-[#005696]/5 mb-4">
            <span className="text-3xl font-black text-[#005696]">CV</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Partner Login</h2>
          <p className="text-slate-500 mt-2 text-sm">Secure access for optometrists</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005696] focus:border-transparent outline-none transition-all"
              placeholder="e.g. dr.john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005696] focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex justify-between items-center text-xs">
            <label className="flex items-center gap-2 text-slate-500">
              <input type="checkbox" className="rounded" defaultChecked /> Remember me
            </label>
            <button type="button" className="text-[#005696] font-semibold">Forgot Password?</button>
          </div>

          <button
            disabled={isLoading}
            className="w-full py-4 bg-[#005696] text-white rounded-xl font-bold shadow-lg shadow-blue-900/10 hover:bg-blue-800 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? 'Verifying...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500">
          Don't have an account? <button onClick={onSwitchToRegister} className="text-[#005696] font-bold">Register Clinic</button>
        </p>

        <div className="pt-8 text-center text-[10px] text-slate-400">
          Powered by CooperVision Rewards Program v1.0
        </div>
      </div>
    </div>
  );
};

export default LoginView;
