
import React, { useState } from 'react';
import { User } from '../types';

interface LoginViewProps {
  onLogin: (user: User) => void;
  onSwitchToRegister: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAdminQuickLogin = () => {
    onLogin({
      id: 'admin-1',
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulation
    setTimeout(() => {
      if (email === 'admin@coopervision.com') {
        handleAdminQuickLogin();
      } else {
        onLogin({
          id: 'user-1',
          full_name: 'Dr. John Doe',
          email: email || 'dr.john@example.com',
          phone: '9876543210',
          shop_name: 'EyeCare Clinic',
          city: 'Pune',
          referral_code: 'OPT-XYZ123',
          role: 'optometrist',
          created_at: new Date().toISOString()
        });
      }
      setIsLoading(false);
    }, 1000);
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email or Mobile</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005696] focus:border-transparent outline-none transition-all"
                placeholder="e.g. 9876543210"
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
