
import React, { useState, useEffect } from 'react';
import { User, Product, Booking, Withdrawal } from './types';
import { INITIAL_PRODUCTS, ICONS } from './constants';
import { supabase } from './lib/supabase';
import Dashboard from './views/Dashboard';
import NewBooking from './views/NewBooking';
import MyBookings from './views/MyBookings';
import Rewards from './views/Rewards';
import AdminDashboard from './views/admin/AdminDashboard';

// Mock users for bypass mode
const MOCK_OPTOMETRIST: User = {
  id: '00000000-0000-0000-0000-000000000000', // Test UUID
  full_name: 'Dr. Test Optometrist',
  email: 'test@cv.com',
  phone: '9876543210',
  shop_name: 'Test Vision Clinic',
  city: 'Mumbai',
  referral_code: 'TEST-OPT-123',
  role: 'optometrist',
  created_at: new Date().toISOString()
};

const MOCK_ADMIN: User = {
  ...MOCK_OPTOMETRIST,
  full_name: 'Admin Controller',
  role: 'admin'
};

const App: React.FC = () => {
  // Start with the mock optometrist by default to bypass login
  const [user, setUser] = useState<User | null>(MOCK_OPTOMETRIST);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'new-booking' | 'history' | 'rewards'>('dashboard');
  const [loading, setLoading] = useState(false);
  
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

  const fetchData = async (currentUser: User) => {
    // Fetch Products
    const { data: prods } = await supabase.from('products').select('*').eq('active', true);
    if (prods) setProducts(prods);

    // Fetch Bookings
    const query = supabase.from('bookings').select('*').order('created_at', { ascending: false });
    if (currentUser.role !== 'admin') {
      // In bypass mode, we might want to see all bookings for testing, 
      // or we can filter by the mock ID
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
    if (user) {
      fetchData(user);
    }
  }, [user]);

  // Set up Realtime Subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => fetchData(user))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals' }, () => fetchData(user))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const toggleRole = () => {
    setUser(prev => prev?.role === 'admin' ? MOCK_OPTOMETRIST : MOCK_ADMIN);
    setActiveTab('dashboard');
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#005696]"></div></div>;

  // We are bypassing the null user check for now
  const activeUser = user || MOCK_OPTOMETRIST;

  if (activeUser.role === 'admin') {
    return (
      <div className="relative h-screen">
        <button 
          onClick={toggleRole}
          className="fixed top-4 right-4 z-[100] bg-orange-500 text-white px-4 py-2 rounded-full text-[10px] font-black shadow-lg hover:bg-orange-600 transition-all uppercase tracking-widest"
        >
          Dev: Switch to User View
        </button>
        <AdminDashboard 
          user={activeUser} onLogout={toggleRole} 
          bookings={bookings} setBookings={setBookings}
          products={products} setProducts={setProducts}
          withdrawals={withdrawals} setWithdrawals={setWithdrawals}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white shadow-xl relative overflow-hidden">
      <header className="p-4 flex items-center justify-between border-b bg-white sticky top-0 z-10">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Bypass Mode Active</span>
          <span className="text-lg font-bold text-[#005696]">{activeUser.full_name}</span>
        </div>
        <button 
          onClick={toggleRole}
          className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tight hover:bg-slate-200"
        >
          Switch to Admin
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 bg-slate-50">
        {activeTab === 'dashboard' && <Dashboard user={activeUser} bookings={bookings} />}
        {activeTab === 'new-booking' && <NewBooking user={activeUser} products={products} onBookingSubmit={() => { fetchData(activeUser); setActiveTab('history'); }} />}
        {activeTab === 'history' && <MyBookings bookings={bookings} />}
        {activeTab === 'rewards' && <Rewards user={activeUser} bookings={bookings} withdrawals={withdrawals} onWithdraw={() => fetchData(activeUser)} />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t flex justify-around p-3 z-10">
        <NavItem active={activeTab === 'dashboard'} icon={<ICONS.Dashboard className="w-6 h-6" />} label="Home" onClick={() => setActiveTab('dashboard')} />
        <NavItem active={activeTab === 'new-booking'} icon={<ICONS.Booking className="w-6 h-6" />} label="New Order" onClick={() => setActiveTab('new-booking')} />
        <NavItem active={activeTab === 'history'} icon={<ICONS.History className="w-6 h-6" />} label="Waitlist" onClick={() => setActiveTab('history')} />
        <NavItem active={activeTab === 'rewards'} icon={<ICONS.Rewards className="w-6 h-6" />} label="Redeem" onClick={() => setActiveTab('rewards')} />
      </nav>
    </div>
  );
};

const NavItem = ({ active, icon, label, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-[#005696] scale-110' : 'text-slate-400'}`}>
    {icon} <span className="text-[10px] font-bold">{label}</span>
  </button>
);

export default App;
