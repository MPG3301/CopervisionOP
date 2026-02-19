
import React, { useState, useEffect, useCallback } from 'react';
import { User, Product, Booking, Withdrawal } from './types';
import { ICONS } from './constants';
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
      // Fetch Products
      const { data: prods } = await supabase.from('products').select('*').order('product_name');
      if (prods) setProducts(prods);

      // Fetch Bookings - Now that schema is standard, we don't need the fallback logic
      let bQuery = supabase.from('bookings').select('*');
      if (currentUser.role !== 'admin') {
        bQuery = bQuery.eq('user_id', currentUser.id);
      }
      
      const { data: bks, error: bError } = await bQuery.order('created_at', { ascending: false });
      if (bks) setBookings(bks);
      if (bError) console.error("Bookings Fetch Error:", bError.message);

      // Fetch Withdrawals
      let wQuery = supabase.from('withdrawals').select('*');
      if (currentUser.role !== 'admin') {
        wQuery = wQuery.eq('user_id', currentUser.id);
      }
      const { data: wths } = await wQuery.order('created_at', { ascending: false });
      if (wths) setWithdrawals(wths);
    } catch (err) {
      console.error("Critical Sync Error:", err);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchData(user);
      localStorage.setItem('cv_user_session', JSON.stringify(user));
      
      // Realtime subscription for instant updates
      const channel = supabase.channel('schema-db-changes')
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
      <div className="min-h-screen bg-slate-50">
        <AdminDashboard 
          user={user} onLogout={handleLogout} 
          bookings={bookings} setBookings={setBookings}
          products={products} setProducts={setProducts}
          withdrawals={withdrawals} setWithdrawals={setWithdrawals}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center">
      <div className="w-full max-w-2xl bg-white min-h-screen shadow-2xl relative flex flex-col border-x border-slate-200">
        <header className="px-6 py-5 bg-white border-b flex justify-between items-center sticky top-0 z-20">
          <div className="flex flex-col">
            <p className="text-[10px] font-black text-[#005696] uppercase tracking-[0.2em] mb-1 leading-none">CooperVision Partner</p>
            <h1 className="text-xl font-black text-slate-900 leading-none">{user.full_name}</h1>
          </div>
          <button onClick={handleLogout} className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-red-500 transition-colors">
             <ICONS.X className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto pb-32">
          {activeTab === 'dashboard' && <Dashboard user={user} bookings={bookings} />}
          {activeTab === 'new-booking' && <NewBooking user={user} products={products} onBookingSubmit={() => { fetchData(user); setActiveTab('history'); }} />}
          {activeTab === 'history' && <MyBookings bookings={bookings} onUpdate={() => fetchData(user)} />}
          {activeTab === 'rewards' && <Rewards user={user} bookings={bookings} withdrawals={withdrawals} onWithdraw={() => fetchData(user)} />}
        </main>

        <nav className="fixed bottom-0 w-full max-w-2xl bg-white/95 backdrop-blur-xl border-t flex justify-around p-4 pb-8 z-30 shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
          <NavItem active={activeTab === 'dashboard'} icon={<ICONS.Dashboard className="w-6 h-6" />} label="Home" onClick={() => setActiveTab('dashboard')} />
          <NavItem active={activeTab === 'new-booking'} icon={<ICONS.Booking className="w-6 h-6" />} label="New Order" onClick={() => setActiveTab('new-booking')} />
          <NavItem active={activeTab === 'history'} icon={<ICONS.History className="w-6 h-6" />} label="Status" onClick={() => setActiveTab('history')} />
          <NavItem active={activeTab === 'rewards'} icon={<ICONS.Rewards className="w-6 h-6" />} label="Wallet" onClick={() => setActiveTab('rewards')} />
        </nav>
      </div>
    </div>
  );
};

const NavItem = ({ active, icon, label, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1.5 transition-all ${active ? 'text-[#005696] scale-105' : 'text-slate-300 hover:text-slate-500'}`}>
    {icon} <span className="text-[10px] font-black uppercase tracking-widest leading-none">{label}</span>
  </button>
);

export default App;
