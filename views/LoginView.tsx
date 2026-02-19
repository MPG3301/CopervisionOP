
// Import React to support React.FC and React.FormEvent types
import React, { useState } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';

interface LoginViewProps {
  onLogin: (user: User) => void;
  onSwitchToRegister: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdminQuickLogin = () => {
    onLogin({
      id: 'admin-1',
      // Fix: Added missing required property 'optometrist_id' for the User interface
      optometrist_id: 'CV-OPT-0000',
      full_name: 'Super Admin',
      email: 'admin@coopervision.com',
      phone: '9999999999',
      shop_name: 'Headquarters',
      city: 'Mumbai',
      referral_code: 'ADMIN-001',
      role: 'admin',
      created_at: new Date().toISOString()
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (profileError) throw profileError;
        onLogin(profile);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid login credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="inline-block p-4 rounded-2xl bg-[#005696]/5 mb-4">
            <span className="text-3xl font-black text-[#005696]">CV</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Partner Login</h2>
          <p className="text-slate-500 mt-2 text-sm">Secure access for optometrists</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-center">
              <p className="text-xs text-red-600 font-bold">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</label>
              <input 
                type="email" 
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005696] focus:border-transparent outline-none transition-all"
                placeholder="e.g. user@example.com"
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
              className={`w-full py-4 bg-[#005696] text-white rounded-xl font-bold shadow-lg shadow-blue-900/10 hover:bg-blue-800 transition-all flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Verifying...' : 'Sign In'}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-bold">Quick Access</span>
            </div>
          </div>

          <button 
            onClick={handleAdminQuickLogin}
            className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            Admin Dashboard Demo
          </button>
        </div>

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
