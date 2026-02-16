
import React, { useState, useEffect } from 'react';
import { User, Product, Booking, Withdrawal } from './types';
import { INITIAL_PRODUCTS, ICONS } from './constants';
import { supabase } from './lib/supabase';
import Dashboard from './views/Dashboard';
import NewBooking from './views/NewBooking';
import MyBookings from './views/MyBookings';
import Rewards from './views/Rewards';
import AdminDashboard from './views/admin/AdminDashboard';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'new-booking' | 'history' | 'rewards'>('dashboard');
  const [loading, setLoading] = useState(false);
  
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

  // Simple detail input form for bypass
  const [simpleName, setSimpleName] = useState('');
  const [simpleShop, setSimpleShop] = useState('');

  const fetchData = async (currentUser: User) => {
    // Fetch Products
    const { data: prods } = await supabase.from('products').select('*').order('product_name');
    if (prods) setProducts(prods);

    // Fetch ALL Bookings if admin, else only personal
    const query = supabase.from('bookings').select('*').order('created_at', { ascending: false });
    if (currentUser.role !== 'admin') {
      query.eq('user_id', currentUser.id);
    }
    const { data: bks, error } = await query;
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

  // Real-time listener for updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => fetchData(user))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals' }, () => fetchData(user))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchData(user))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleSimpleLogin = (role: 'optometrist' | 'admin') => {
    const mockUser: User = {
      id: role === 'admin' ? 'admin-bypass-id' : `user-${Date.now()}`,
      full_name: simpleName || (role === 'admin' ? 'Super Admin' : 'Dr. Test Partner'),
      email: `${role}@coopervision.com`,
      phone: '9876543210',
      shop_name: simpleShop || 'CooperVision Clinic',
      city: 'Mumbai',
      referral_code: `CV-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      role: role,
      created_at: new Date().toISOString()
    };
    setUser(mockUser);
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#005696]"></div></div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl p-10 space-y-8">
          <div className="text-center">
             <div className="w-16 h-16 bg-[#005696]/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-black text-[#005696]">CV</span>
             </div>
             <h2 className="text-2xl font-black text-slate-900">Partner Access</h2>
             <p className="text-slate-400 text-xs mt-1 font-bold">Bypass Mode: Enter details to continue</p>
          </div>

          <div className="space-y-4">
             <input 
               placeholder="Your Full Name" 
               className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold"
               value={simpleName}
               onChange={e => setSimpleName(e.target.value)}
             />
             <input 
               placeholder="Clinic / Shop Name" 
               className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold"
               value={simpleShop}
               onChange={e => setSimpleShop(e.target.value)}
             />
          </div>

          <div className="flex flex-col gap-3">
             <button onClick={() => handleSimpleLogin('optometrist')} className="w-full py-5 bg-[#005696] text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-900/20">Login as Partner</button>
             <button onClick={() => handleSimpleLogin('admin')} className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black text-sm uppercase tracking-widest">Admin Control</button>
          </div>
        </div>
      </div>
    );
  }

  if (user.role === 'admin') {
    return (
      <AdminDashboard 
        user={user} onLogout={() => setUser(null)} 
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
          <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Partner View</span>
          <span className="text-lg font-bold text-[#005696]">{user.full_name}</span>
        </div>
        <button onClick={() => setUser(null)} className="text-xs text-slate-400 font-bold uppercase">Logout</button>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 bg-slate-50">
        {activeTab === 'dashboard' && <Dashboard user={user} bookings={bookings} />}
        {activeTab === 'new-booking' && <NewBooking user={user} products={products} onBookingSubmit={() => { fetchData(user); setActiveTab('history'); }} />}
        {activeTab === 'history' && <MyBookings bookings={bookings} />}
        {activeTab === 'rewards' && <Rewards user={user} bookings={bookings} withdrawals={withdrawals} onWithdraw={() => fetchData(user)} />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t flex justify-around p-3 z-10">
        <NavItem active={activeTab === 'dashboard'} icon={<ICONS.Dashboard className="w-6 h-6" />} label="Home" onClick={() => setActiveTab('dashboard')} />
        <NavItem active={activeTab === 'new-booking'} icon={<ICONS.Booking className="w-6 h-6" />} label="Order" onClick={() => setActiveTab('new-booking')} />
        <NavItem active={activeTab === 'history'} icon={<ICONS.History className="w-6 h-6" />} label="Waitlist" onClick={() => setActiveTab('history')} />
        <NavItem active={activeTab === 'rewards'} icon={<ICONS.Rewards className="w-6 h-6" />} label="Wallet" onClick={() => setActiveTab('rewards')} />
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
