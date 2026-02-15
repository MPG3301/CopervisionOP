
import React, { useState } from 'react';
import { User } from '../types';

interface RegistrationViewProps {
  onRegister: (user: User) => void;
  onSwitchToLogin: () => void;
}

const RegistrationView: React.FC<RegistrationViewProps> = ({ onRegister, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    shopName: '',
    city: ''
  });
  const [step, setStep] = useState(1); 
  const [isVerifying, setIsVerifying] = useState(false);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleVerify = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsVerifying(true);
    
    // Simulate API call
    setTimeout(() => {
      const newUser: User = {
        id: 'u-' + Math.random().toString(36).substr(2, 9),
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        shop_name: formData.shopName,
        city: formData.city,
        referral_code: 'OPT-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        role: 'optometrist',
        created_at: new Date().toISOString()
      };
      
      onRegister(newUser);
      setIsVerifying(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col justify-center items-center">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Create Account</h2>
          <p className="text-slate-500 text-sm">Register your clinic for rewards</p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleNext} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
              <input 
                type="text" required
                placeholder="Dr. Name"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005696] transition-all"
                value={formData.fullName}
                onChange={e => setFormData({...formData, fullName: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</label>
                <input 
                  type="email" required
                  placeholder="name@email.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005696] transition-all"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mobile</label>
                <input 
                  type="tel" required
                  placeholder="91..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005696] transition-all"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Shop / Clinic Name</label>
              <input 
                type="text" required
                placeholder="Clinic Name"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005696] transition-all"
                value={formData.shopName}
                onChange={e => setFormData({...formData, shopName: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">City</label>
              <input 
                type="text" required
                placeholder="Your City"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005696] transition-all"
                value={formData.city}
                onChange={e => setFormData({...formData, city: e.target.value})}
              />
            </div>

            <button 
              type="submit"
              className="w-full py-4 bg-[#005696] text-white rounded-xl font-bold mt-4 shadow-lg shadow-blue-900/20 active:scale-95 transition-all"
            >
              Continue
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-slate-600 mb-2">Enter the verification code sent to</p>
              <p className="font-bold text-[#005696]">{formData.phone}</p>
            </div>
            
            <form onSubmit={handleVerify} className="space-y-6">
              <div className="flex gap-3 justify-center">
                {[1,2,3,4].map(i => (
                  <input 
                    key={i} 
                    type="text" 
                    maxLength={1} 
                    pattern="[0-9]*"
                    inputMode="numeric"
                    required
                    className="w-12 h-14 text-center text-xl font-bold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005696] outline-none" 
                  />
                ))}
              </div>
              
              <button 
                type="submit"
                disabled={isVerifying}
                className="w-full py-4 bg-[#005696] text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Creating Profile...
                  </>
                ) : 'Verify & Finish'}
              </button>
            </form>
            
            <button onClick={() => setStep(1)} className="w-full text-slate-400 text-sm font-medium hover:text-slate-600">
              Edit phone number
            </button>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-50 text-center">
          <p className="text-sm text-slate-500">
            Already a partner? <button onClick={onSwitchToLogin} className="text-[#005696] font-bold hover:underline">Login here</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegistrationView;
