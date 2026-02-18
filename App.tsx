
import React, { useState, useEffect, useCallback } from 'react';
import { User, Product, Booking, Withdrawal } from './types';
import { INITIAL_PRODUCTS, ICONS } from './constants';
import { supabase } from './lib/supabase';
import Dashboard from './views/Dashboard';
import NewBooking from './views/NewBooking';
import MyBookings from './views/MyBookings';
import Rewards from './views/Rewards';
import AdminDashboard from './views/admin/AdminDashboard';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('cv_user_session');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'new-booking' | 'history' | 'rewards'>('dashboard');
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

  // Registration States
  const [regStep, setRegStep] = useState<'login' | 'otp' | 'details'>('login');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formOTP, setFormOTP] = useState('');
  const [formName, setFormName] = useState('');
  const [formShop, setFormShop] = useState('');
  const [formCity, setFormCity] = useState('');

  const fetchData = useCallback(async (currentUser: User) => {
    const { data: prods } = await supabase.from('products').select('*').order('product_name');
    if (prods) setProducts(prods);

    const bQuery = supabase.from('bookings').select('*').order('created_at', { ascending: false });
    if (currentUser.role !== 'admin') bQuery.eq('user_id', currentUser.id);
    const { data: bks } = await bQuery;
    if (bks) setBookings(bks);

    const wQuery = supabase.from('withdrawals').select('*').order('created_at', { ascending: false });
    if (currentUser.role !== 'admin') wQuery.eq('user_id', currentUser.id);
    const { data: wths } = await wQuery;
    if (wths) setWithdrawals(wths);
  }, []);

  useEffect(() => {
    if (user) {
      fetchData(user);
      localStorage.setItem('cv_user_session', JSON.stringify(user));
      const channel = supabase.channel('realtime-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => fetchData(user))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals' }, () => fetchData(user))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchData(user))
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [user, fetchData]);

  const handleOTPRequest = () => {
    if (!formPhone || formPhone.length < 10) return alert('Enter valid 10-digit mobile number');
    // Simulated OTP
    setRegStep('otp');
  };

  const handleOTPVerify = () => {
    if (formOTP === '1234') { // Mock verification
      setRegStep('details');
    } else {
      alert('Invalid OTP. Use 1234 for testing.');
    }
  };

  const handleFinalRegister = (role: 'optometrist' | 'admin' = 'optometrist') => {
    const id = `u_${Date.now()}`;
    const referral = `OPT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const optId = `CV-OPT-${Math.floor(Math.random() * 90000 + 10000)}`;

    const newUser: User = {
      id,
      optometrist_id: optId,
      full_name: formName || 'Guest Professional',
      email: formEmail || `${id}@example.com`,
      phone: formPhone,
      shop_name: formShop || 'CooperVision Partner',
      city: formCity || 'Mumbai',
      referral_code: referral,
      role: role,
      created_at: new Date().toISOString()
    };

    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('cv_user_session');
    setUser(null);
    setRegStep('login');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md bg-white rounded-[40px] border border-slate-100 shadow-[0_32px_64px_rgba(0,0,0,0.08)] p-10 space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="text-center">
             <div className="w-20 h-20 bg-[#005696] rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-200">
                <span className="text-3xl font-black text-white">CV</span>
             </div>
             <h2 className="text-3xl font-black text-slate-900 tracking-tight">
               {regStep === 'login' ? 'Partner Access' : regStep === 'otp' ? 'Verification' : 'Registration'}
             </h2>
             <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-2">CooperVision Rewards</p>
          </div>

          {regStep === 'login' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <input 
                  type="tel" placeholder="Mobile Number" 
                  className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold focus:border-[#005696] focus:bg-white outline-none transition-all"
                  value={formPhone} onChange={e => setFormPhone(e.target.value)}
                />
                <input 
                  type="email" placeholder="Email Address (Optional)" 
                  className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold focus:border-[#005696] focus:bg-white outline-none transition-all"
                  value={formEmail} onChange={e => setFormEmail(e.target.value)}
                />
              </div>
              <button onClick={handleOTPRequest} className="w-full py-5 bg-[#005696] text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-900/20 active:scale-95 transition-all">Get OTP</button>
              <button onClick={() => handleFinalRegister('admin')} className="w-full py-4 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-[#005696] transition-colors">Admin Dashboard Demo</button>
            </div>
          )}

          {regStep === 'otp' && (
            <div className="space-y-6">
              <p className="text-center text-sm text-slate-500 font-medium">OTP sent to <b>+91 {formPhone}</b></p>
              <input 
                type="text" placeholder="Enter 4-digit OTP" maxLength={4}
                className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black text-center text-2xl tracking-[1em] focus:border-[#005696] focus:bg-white outline-none transition-all"
                value={formOTP} onChange={e => setFormOTP(e.target.value)}
              />
              <button onClick={handleOTPVerify} className="w-full py-5 bg-[#005696] text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-900/20 active:scale-95 transition-all">Verify OTP</button>
            </div>
          )}

          {regStep === 'details' && (
            <div className="space-y-4">
              <input placeholder="Full Name" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-xl font-bold" value={formName} onChange={e=>setFormName(e.target.value)} />
              <input placeholder="Shop / Clinic Name" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-xl font-bold" value={formShop} onChange={e=>setFormShop(e.target.value)} />
              <input placeholder="City" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-xl font-bold" value={formCity} onChange={e=>setFormCity(e.target.value)} />
              <button onClick={() => handleFinalRegister()} className="w-full py-5 bg-[#005696] text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-900/20 active:scale-95 transition-all mt-4">Complete Profile</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (user.role === 'admin') {
    return (
      <AdminDashboard 
        user={user} onLogout={handleLogout} 
        bookings={bookings} setBookings={setBookings}
        products={products} setProducts={setProducts}
        withdrawals={withdrawals} setWithdrawals={setWithdrawals}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white shadow-2xl relative overflow-hidden font-sans border-x border-slate-100">
      <header className="px-6 py-5 bg-white border-b flex justify-between items-center sticky top-0 z-20">
        <div className="flex flex-col">
          <p className="text-[9px] font-black text-[#005696] uppercase tracking-[0.2em] mb-1">CooperVision Partner</p>
          <h1 className="text-xl font-black text-slate-900 leading-none">{user.full_name}</h1>
        </div>
        <button onClick={handleLogout} className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-red-500 transition-colors">
           <ICONS.X className="w-5 h-5" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-28 bg-slate-50/40">
        {activeTab === 'dashboard' && <Dashboard user={user} bookings={bookings} />}
        {activeTab === 'new-booking' && <NewBooking user={user} products={products} onBookingSubmit={() => setActiveTab('history')} />}
        {activeTab === 'history' && <MyBookings bookings={bookings} />}
        {activeTab === 'rewards' && <Rewards user={user} bookings={bookings} withdrawals={withdrawals} onWithdraw={() => fetchData(user)} />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-xl border-t flex justify-around p-4 pb-6 z-30 shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
        <NavItem active={activeTab === 'dashboard'} icon={<ICONS.Dashboard className="w-6 h-6" />} label="Home" onClick={() => setActiveTab('dashboard')} />
        <NavItem active={activeTab === 'new-booking'} icon={<ICONS.Booking className="w-6 h-6" />} label="New Order" onClick={() => setActiveTab('new-booking')} />
        <NavItem active={activeTab === 'history'} icon={<ICONS.History className="w-6 h-6" />} label="Waitlist" onClick={() => setActiveTab('history')} />
        <NavItem active={activeTab === 'rewards'} icon={<ICONS.Rewards className="w-6 h-6" />} label="Wallet" onClick={() => setActiveTab('rewards')} />
      </nav>
    </div>
  );
};

const NavItem = ({ active, icon, label, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1.5 transition-all ${active ? 'text-[#005696] scale-105' : 'text-slate-300'}`}>
    {icon} <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

export default App;
