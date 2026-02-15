import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { User, Product, Booking, Withdrawal } from './types';
import { INITIAL_PRODUCTS, COLORS, ICONS } from './constants';
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

  // Data State
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

  // Auth Listener & Initial Data Fetch
  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserData(session.user.id, session.user.email);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserData(session.user.id, session.user.email);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string, email?: string) => {
    try {
      // Fetch user profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profile) {
        setUser({ ...profile, email: email || profile.email }); // Ensure email is present
        // Fetch related data
        fetchAppData();
      } else if (email) {
        // Fallback if profile doesn't exist yet (e.g. right after registration)
        // You might want to create it here or handle it in Registration
        setUser({
          id: userId,
          email: email,
          full_name: 'New User',
          role: 'optometrist',
          created_at: new Date().toISOString()
        } as User);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppData = async () => {
    // Fetch products, bookings, withdrawals
    const { data: productsData } = await supabase.from('products').select('*');
    if (productsData && productsData.length > 0) setProducts(productsData);

    const { data: bookingsData } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
    if (bookingsData) setBookings(bookingsData);

    const { data: withdrawalsData } = await supabase.from('withdrawals').select('*').order('created_at', { ascending: false });
    if (withdrawalsData) setWithdrawals(withdrawalsData);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setBookings([]);
    setWithdrawals([]);
    setActiveTab('dashboard');
  };

  if (loading) {
    return <div className="h-screen flex items-center justify-center text-[#005696]">Loading...</div>;
  }

  if (!user) {
    if (isRegistering) {
      return <RegistrationView onSwitchToLogin={() => setIsRegistering(false)} />;
    }
    return <LoginView onSwitchToRegister={() => setIsRegistering(true)} />;
  }

  // Admin Route
  if (user.role === 'admin') {
    return (
      <AdminDashboard
        user={user}
        onLogout={handleLogout}
        bookings={bookings}
        setBookings={setBookings}
        products={products}
        setProducts={setProducts}
        withdrawals={withdrawals}
        setWithdrawals={setWithdrawals}
      />
    );
  }

  // Mobile App Routes... (rest is same logic, just mapped data)
  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white shadow-xl relative overflow-hidden">
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b bg-white sticky top-0 z-10">
        <div className="flex flex-col">
          <span className="text-xs text-slate-500 font-medium">Hello,</span>
          <span className="text-lg font-bold text-[#005696]">{user.full_name}</span>
        </div>
        <button onClick={handleLogout} className="text-xs text-slate-400 hover:text-red-500 transition-colors">Logout</button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 bg-slate-50">
        {activeTab === 'dashboard' && <Dashboard user={user} bookings={bookings} />}
        {activeTab === 'new-booking' && (
          <NewBooking
            user={user}
            products={products}
            onBookingSubmit={async (b) => {
              // Optimistic update, but normally should post to DB
              const { data, error } = await supabase.from('bookings').insert([{
                ...b,
                user_id: user.id
              }]).select().single();

              if (data) {
                setBookings([data, ...bookings]);
                setActiveTab('history');
              } else if (error) {
                alert("Error booking: " + error.message);
              }
            }}
          />
        )}
        {activeTab === 'history' && <MyBookings bookings={bookings.filter(b => b.user_id === user.id)} />}
        {activeTab === 'rewards' && (
          <Rewards
            user={user}
            bookings={bookings}
            withdrawals={withdrawals}
            onWithdraw={async (w) => {
              const { data, error } = await supabase.from('withdrawals').insert([{
                ...w,
                user_id: user.id
              }]).select().single();
              if (data) setWithdrawals([data, ...withdrawals]);
            }}
          />
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t flex justify-around p-3 z-10">
        <NavItem
          active={activeTab === 'dashboard'}
          icon={<ICONS.Dashboard className="w-6 h-6" />}
          label="Home"
          onClick={() => setActiveTab('dashboard')}
        />
        <NavItem
          active={activeTab === 'new-booking'}
          icon={<ICONS.Booking className="w-6 h-6" />}
          label="Booking"
          onClick={() => setActiveTab('new-booking')}
        />
        <NavItem
          active={activeTab === 'history'}
          icon={<ICONS.History className="w-6 h-6" />}
          label="Orders"
          onClick={() => setActiveTab('history')}
        />
        <NavItem
          active={activeTab === 'rewards'}
          icon={<ICONS.Rewards className="w-6 h-6" />}
          label="Rewards"
          onClick={() => setActiveTab('rewards')}
        />
      </nav>
    </div>
  );
};

const NavItem: React.FC<{ active: boolean; icon: React.ReactNode; label: string; onClick: () => void }> = ({ active, icon, label, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-[#005696]' : 'text-slate-400'}`}>
    {icon}
    <span className="text-[10px] font-semibold">{label}</span>
    {active && <div className="w-1 h-1 rounded-full bg-[#005696]"></div>}
  </button>
);

export default App;
