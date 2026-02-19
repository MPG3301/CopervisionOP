
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

  // Forgot Password States
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [resetStatus, setResetStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const handleAdminQuickLogin = () => {
    onLogin({
      id: 'admin-1',
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetLoading(true);
    setResetStatus(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: window.location.origin + '/reset-password',
      });

      if (error) throw error;

      setResetStatus({ type: 'success', msg: 'Password reset link sent! Please check your inbox.' });
    } catch (err: any) {
      setResetStatus({ type: 'error', msg: err.message || 'Could not send reset link' });
    } finally {
      setIsResetLoading(false);
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
              <button 
                type="button" 
                onClick={() => setIsResetModalOpen(true)}
                className="text-[#005696] font-semibold"
              >
                Forgot Password?
              </button>
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

      {/* Forgot Password Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl relative">
            <button 
              onClick={() => { setIsResetModalOpen(false); setResetStatus(null); }}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-blue-50 text-[#005696] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Reset Password</h3>
              <p className="text-xs text-slate-500 mt-1">We'll send a link to your email</p>
            </div>

            {resetStatus && (
              <div className={`mb-4 p-3 rounded-xl text-center text-[11px] font-bold ${resetStatus.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                {resetStatus.msg}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Work Email</label>
                <input 
                  type="email" 
                  required
                  placeholder="name@clinic.com"
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-[#005696] outline-none transition-all font-medium"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
              </div>
              <button 
                disabled={isResetLoading}
                className="w-full py-4 bg-[#005696] text-white rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-blue-900/20 active:scale-95 transition-all"
              >
                {isResetLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginView;
