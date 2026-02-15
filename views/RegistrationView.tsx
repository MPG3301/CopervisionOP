import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { UserRole } from '../types';

interface RegistrationViewProps {
  onSwitchToLogin: () => void;
}

const RegistrationView: React.FC<RegistrationViewProps> = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    shopName: '',
    city: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReferralCode = () => {
    return 'OPT-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        phone: formData.phone // Optional, but good to store
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Create profile record
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: authData.user.id,
            full_name: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            shop_name: formData.shopName,
            city: formData.city,
            referral_code: generateReferralCode(),
            role: 'optometrist' as UserRole
          }]);

        if (profileError) {
          // If profile creation fails, we might want to clean up auth user or show specific error
          console.error('Profile creation error:', profileError);
          throw new Error('Account created but profile setup failed. Please contact support.');
        }

        // Success! App.tsx auth listener handles the rest
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col justify-center items-center">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Create Account</h2>
          <p className="text-slate-500 text-sm">Register your clinic for rewards</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Full Name</label>
            <input
              type="text" required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
              value={formData.fullName}
              onChange={e => setFormData({ ...formData, fullName: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Email</label>
              <input
                type="email" required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Mobile</label>
              <input
                type="tel" required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Password</label>
            <input
              type="password" required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Shop / Clinic Name</label>
            <input
              type="text" required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
              value={formData.shopName}
              onChange={e => setFormData({ ...formData, shopName: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">City</label>
            <input
              type="text" required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
              value={formData.city}
              onChange={e => setFormData({ ...formData, city: e.target.value })}
            />
          </div>

          <button disabled={loading} className="w-full py-4 bg-[#005696] text-white rounded-xl font-bold mt-4 shadow-lg shadow-blue-900/20">
            {loading ? 'Creating Account...' : 'Continue'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t text-center">
          <p className="text-sm text-slate-500">Already a partner? <button onClick={onSwitchToLogin} className="text-[#005696] font-bold underline">Login here</button></p>
        </div>
      </div>
    </div>
  );
};

export default RegistrationView;
