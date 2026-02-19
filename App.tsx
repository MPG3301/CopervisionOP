
import React, { useState, useEffect, useCallback } from 'react';
import { User, Product, Booking, Withdrawal } from './types';
import { INITIAL_PRODUCTS, ICONS } from './constants';
import { supabase } from './lib/supabase';
import Dashboard from './views/Dashboard';
import NewBooking from './views/NewBooking';
import MyBookings from './views/MyBookings';
import Rewards from './views/Rewards';
import AdminDashboard from './views/admin/AdminDashboard';
import LoginView from './views/LoginView';
import RegistrationView from './views/RegistrationView';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('cv_user_session');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'new-booking' | 'history' | 'rewards'>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

  const fetchData = useCallback(async (currentUser: User) => {
    try {
      // 1. Fetch Products - Resilient to schema errors
      let pQuery = supabase.from('products').select('*');
      const { data: prods, error: pError } = await pQuery.order('product_name');
      if (pError) {
        const { data: fp } = await pQuery;
        if (fp) setProducts(fp);
      } else if (prods) {
        setProducts(prods);
      }

      // 2. Fetch Bookings - Robust fallback for 'created_at' schema cache error
      let bQuery = supabase.from('bookings').select('*');
      if (currentUser.role !== 'admin') bQuery = bQuery.eq('user_id', currentUser.id);
      
      const { data: bks, error: bError } = await bQuery.order('created_at', { ascending: false });
      
      if (bError && (bError.message.includes('created_at') || bError.code === 'PGRST204')) {
        const { data: fbks } = await bQuery;
        if (fbks) setBookings(fbks);
      } else if (bks) {
        setBookings(bks);
      }

      // 3. Fetch Withdrawals
      let wQuery = supabase.from('withdrawals').select('*');
      if (currentUser.role !== 'admin') wQuery = wQuery.eq('user_id', currentUser.id);
      
      const { data: wths, error: wError } = await wQuery.order('created_at', { ascending: false });
      if (wError) {
        const { data: fwths } = await wQuery;
        if (fwths) setWithdrawals(fwths);
      } else if (wths) {
        setWithdrawals(wths);
      }
    } catch (err) {
      console.error("Critical Sync Error:", err);
    }
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

  const handleLogout = () => {
    localStorage.removeItem('cv_user_session');
    setUser(null);
  };

  if (!user) {
    return authView === 'login' ? (
      <LoginView onLogin={setUser} onSwitchToRegister={() => setAuthView('register')} />
    ) : (
      <RegistrationView onRegister={setUser} onSwitchToLogin={() => setAuthView('login')} />
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
          <p className="text-[9px] font-black text-[#005696] uppercase tracking-[0.2em] mb-1 leading-none">CooperVision Partner</p>
          <h1 className="text-xl font-black text-slate-900 leading-none">{user.full_name}</h1>
        </div>
        <button onClick={handleLogout} className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-red-500 transition-colors">
           <ICONS.X className="w-5 h-5" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-28 bg-slate-50/40">
        {activeTab === 'dashboard' && <Dashboard user={user} bookings={bookings} />}
        {activeTab === 'new-booking' && <NewBooking user={user} products={products} onBookingSubmit={() => { fetchData(user); setActiveTab('history'); }} />}
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
