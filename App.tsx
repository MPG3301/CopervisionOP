import React, { useState, useEffect } from 'react';
import { User, Product, Booking, Withdrawal } from './types';
import { INITIAL_PRODUCTS, ICONS } from './constants';
import { supabase } from './lib/supabase';
import LoginView from './views/LoginView';
import RegistrationView from './views/RegistrationView';
import Dashboard from './views/Dashboard';
import NewBooking from './views/NewBooking';
import MyBookings from './views/MyBookings';
import Rewards from './views/Rewards';
import AdminDashboard from './views/admin/AdminDashboard';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'new-booking' | 'history' | 'rewards'>('dashboard');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

  const fetchData = async (currentUser: User) => {
    // Fetch Products
    const { data: prods } = await supabase.from('products').select('*').eq('active', true);
    if (prods) setProducts(prods);

    // Fetch Bookings (Real-time compatible)
    const query = supabase.from('bookings').select('*').order('created_at', { ascending: false });
    if (currentUser.role !== 'admin') {
      query.eq('user_id', currentUser.id);
    }
    const { data: bks } = await query;
    if (bks) setBookings(bks);

    // Fetch Withdrawals
    const wQuery = supabase.from('withdrawals').select('*').order('created_at', { ascending: false });
    if (currentUser.role !== 'admin') {
      wQuery.eq('user_id', currentUser.id);
    }
    const { data: wths } = await wQuery;
    if (wths) setWithdrawals(wths);
  };

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (profile) {
          setUser(profile);
          fetchData(profile);
        }
      }
      setLoading(false);
    };
    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (profile) {
          setUser(profile);
          fetchData(profile);
        }
      } else {
        setUser(null);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  // Set up Realtime Subscription for ALL users
  useEffect(() => {
    if (!user) return;
    // Fix: Adding required 'schema: public' to the postgres_changes filter to match the overloaded method signature
    const channel = supabase.channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => fetchData(user))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals' }, () => fetchData(user))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#005696]"></div></div>;

  if (!user) {
    return isRegistering 
      ? <RegistrationView onRegister={setUser} onSwitchToLogin={() => setIsRegistering(false)} />
      : <LoginView onLogin={setUser} onSwitchToRegister={() => setIsRegistering(true)} />;
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
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white shadow-xl relative overflow-hidden">
      <header className="p-4 flex items-center justify-between border-b bg-white sticky top-0 z-10">
        <div className="flex flex-col">
          <span className="text-xs text-slate-500">Optometrist</span>
          <span className="text-lg font-bold text-[#005696]">{user.full_name}</span>
        </div>
        <button onClick={handleLogout} className="text-xs text-slate-400">Logout</button>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 bg-slate-50">
        {activeTab === 'dashboard' && <Dashboard user={user} bookings={bookings} />}
        {activeTab === 'new-booking' && <NewBooking user={user} products={products} onBookingSubmit={() => setActiveTab('history')} />}
        {activeTab === 'history' && <MyBookings bookings={bookings} />}
        {activeTab === 'rewards' && <Rewards user={user} bookings={bookings} withdrawals={withdrawals} onWithdraw={() => fetchData(user)} />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t flex justify-around p-3 z-10">
        <NavItem active={activeTab === 'dashboard'} icon={<ICONS.Dashboard className="w-6 h-6" />} label="Home" onClick={() => setActiveTab('dashboard')} />
        <NavItem active={activeTab === 'new-booking'} icon={<ICONS.Booking className="w-6 h-6" />} label="New Order" onClick={() => setActiveTab('new-booking')} />
        <NavItem active={activeTab === 'history'} icon={<ICONS.History className="w-6 h-6" />} label="History" onClick={() => setActiveTab('history')} />
        <NavItem active={activeTab === 'rewards'} icon={<ICONS.Rewards className="w-6 h-6" />} label="Rewards" onClick={() => setActiveTab('rewards')} />
      </nav>
    </div>
  );
};

const NavItem = ({ active, icon, label, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 ${active ? 'text-[#005696]' : 'text-slate-400'}`}>
    {icon} <span className="text-[10px] font-bold">{label}</span>
  </button>
);

export default App;