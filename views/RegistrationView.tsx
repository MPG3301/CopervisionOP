
import React, { useState } from 'react';
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
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);
    
    try {
      // 1. Create User in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;
      
      const authUser = authData?.user;
      
      // If email confirmation is ON in Supabase, we might not get a session immediately
      if (!authUser) {
        throw new Error("Registration started, but no user was returned. Please check if the email is already in use.");
      }

      // 2. Prepare Profile Data using the exact ID from Auth
      const profileData = {
        id: authUser.id,
        optometrist_id: `CV-OPT-${Math.floor(Math.random() * 90000 + 10000)}`,
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        shop_name: formData.shopName,
        city: formData.city,
        referral_code: 'OPT-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        role: 'optometrist'
      };

      // 3. Insert into profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([profileData]);
      
      if (profileError) {
        console.error("Profile creation error:", profileError);
        throw new Error(`Auth account created, but profile setup failed: ${profileError.message}`);
      }

      // If we have a session, log them in. If not, they need to confirm email.
      if (authData.session) {
        onRegister(profileData as any);
      } else {
        setSuccessMsg("Account created! Please check your email for a confirmation link before logging in.");
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error("Registration Exception:", err);
      setError(err.message || "An unexpected error occurred during registration.");
      setIsLoading(false);
    }
  };

  if (successMsg) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-[40px] p-10 text-center shadow-xl border border-slate-100">
           <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
           </div>
           <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Verify Email</h2>
           <p className="text-slate-500 font-medium mb-8 leading-relaxed">{successMsg}</p>
           <button onClick={onSwitchToLogin} className="w-full py-4 bg-[#005696] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-900/20">Back to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col justify-center items-center">
      <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 p-10 border border-slate-100">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-[#005696]/5 rounded-3xl flex items-center justify-center mx-auto mb-4">
             <span className="text-3xl font-black text-[#005696]">CV</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Partner Sign Up</h2>
          <p className="text-slate-400 text-sm mt-1 font-medium italic">Join the CooperVision rewards network</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl">
            <p className="text-xs text-red-600 font-bold text-center leading-relaxed">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
            <input 
              type="text" required
              placeholder="Dr. Jane Smith"
              className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-[#005696] focus:bg-white transition-all outline-none font-bold text-slate-800"
              value={formData.fullName}
              onChange={e => setFormData({...formData, fullName: e.target.value})}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Work Email</label>
            <input 
              type="email" required
              placeholder="jane@optics.com"
              className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-[#005696] focus:bg-white transition-all outline-none font-bold text-slate-800"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <input 
                type="password" required minLength={6}
                placeholder="••••••••"
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-[#005696] focus:bg-white transition-all outline-none font-bold text-slate-800"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Clinic Name</label>
              <input 
                type="text" required
                placeholder="Vision Care"
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-[#005696] focus:bg-white transition-all outline-none font-bold text-slate-800"
                value={formData.shopName}
                onChange={e => setFormData({...formData, shopName: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">City</label>
              <input 
                type="text" required
                placeholder="Mumbai"
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-[#005696] focus:bg-white transition-all outline-none font-bold text-slate-800"
                value={formData.city}
                onChange={e => setFormData({...formData, city: e.target.value})}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className={`w-full py-5 rounded-2xl font-black text-white shadow-xl shadow-blue-900/20 transition-all active:scale-95 flex items-center justify-center gap-3 mt-4 ${isLoading ? 'bg-slate-400' : 'bg-[#005696] hover:bg-blue-800'}`}
          >
            {isLoading ? "CREATING ACCOUNT..." : "REGISTER CLINIC"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-50 text-center">
          <p className="text-sm text-slate-500 font-bold">
            Already registered? <button onClick={onSwitchToLogin} className="text-[#005696] font-bold">Log In</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegistrationView;
