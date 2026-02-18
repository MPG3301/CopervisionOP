import React, { useState, useRef } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';

interface RegistrationViewProps {
  onRegister: (user: User) => void;
  onSwitchToLogin: () => void;
}

const RegistrationView: React.FC<RegistrationViewProps> = ({ onRegister, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    shopName: '',
    city: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      // 1. Create User in Supabase Auth
      // Note: Admin should disable "Email confirmation" in Supabase dashboard for instant access.
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Registration failed");

      // 2. Create Profile in 'profiles' table
      // Fix: Added missing optometrist_id property required by the User interface
      const newUser: User = {
        id: authData.user.id,
        optometrist_id: `CV-OPT-${Math.floor(Math.random() * 90000 + 10000)}`,
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        shop_name: formData.shopName,
        city: formData.city,
        referral_code: 'OPT-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        role: 'optometrist',
        created_at: new Date().toISOString()
      };

      const { error: profileError } = await supabase.from('profiles').insert([newUser]);
      
      // If profile exists or other error, we still try to proceed if auth was successful
      if (profileError && profileError.code !== '23505') throw profileError;
      
      onRegister(newUser);
    } catch (err: any) {
      setError(err.message || "Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCityKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitButtonRef.current?.focus();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col justify-center items-center">
      <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 p-10 border border-slate-100">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-[#005696]/5 rounded-3xl flex items-center justify-center mx-auto mb-4">
             <span className="text-3xl font-black text-[#005696]">CV</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Partner Sign Up</h2>
          <p className="text-slate-400 text-sm mt-1 font-medium italic">Instant access to rewards portal</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl">
            <p className="text-xs text-red-600 font-bold text-center leading-relaxed">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
            <input 
              type="text" required
              placeholder="e.g. Dr. Jane Smith"
              className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-[#005696] focus:bg-white transition-all outline-none font-bold text-slate-800"
              value={formData.fullName}
              onChange={e => setFormData({...formData, fullName: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Work Email</label>
              <input 
                type="email" required
                placeholder="jane@..."
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-[#005696] focus:bg-white transition-all outline-none font-bold text-slate-800"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile No</label>
              <input 
                type="tel" required
                placeholder="+91..."
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-[#005696] focus:bg-white transition-all outline-none font-bold text-slate-800"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Set Password</label>
            <input 
              type="password" required minLength={6}
              placeholder="••••••••"
              className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-[#005696] focus:bg-white transition-all outline-none font-bold text-slate-800"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Clinic / Shop Title</label>
            <input 
              type="text" required
              placeholder="e.g. Vision Center"
              className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-[#005696] focus:bg-white transition-all outline-none font-bold text-slate-800"
              value={formData.shopName}
              onChange={e => setFormData({...formData, shopName: e.target.value})}
            />
          </div>

          <button 
            type="submit"
            ref={submitButtonRef}
            disabled={isLoading}
            className={`w-full py-5 rounded-2xl font-black text-white shadow-xl shadow-blue-900/20 transition-all active:scale-95 flex items-center justify-center gap-3 ${isLoading ? 'bg-slate-400' : 'bg-[#005696] hover:bg-blue-800'}`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full"></div>
                Initializing...
              </>
            ) : 'Join Now'}
          </button>
        </form>

        <div className="mt-10 pt-6 border-t border-slate-50 text-center">
          <p className="text-sm text-slate-500 font-bold">
            Already a partner? <button onClick={onSwitchToLogin} className="text-[#005696] hover:underline">Log In</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegistrationView;