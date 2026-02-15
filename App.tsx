
import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole, Product, Booking, Withdrawal, BookingStatus } from './types';
import { INITIAL_PRODUCTS, COLORS, ICONS } from './constants';
import LoginView from './views/LoginView';
import RegistrationView from './views/RegistrationView';
import Dashboard from './views/Dashboard';
import NewBooking from './views/NewBooking';
import MyBookings from './views/MyBookings';
import Rewards from './views/Rewards';
import AdminDashboard from './views/admin/AdminDashboard';

// Initial Mock Data for Admin View
const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'BK-1001',
    user_id: 'user-2',
    product_id: '1',
    product_name: 'Biofinity (6 Lenses)',
    quantity: 10,
    status: 'waiting',
    points_earned: 5000,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    optometrist_name: 'Dr. Sarah Wilson'
  },
  {
    id: 'BK-1002',
    user_id: 'user-3',
    product_id: '2',
    product_name: 'MyDay (30 Lenses)',
    quantity: 5,
    status: 'approved',
    points_earned: 4000,
    created_at: new Date(Date.now() - 7200000).toISOString(),
    optometrist_name: 'Dr. Michael Chen'
  },
  {
    id: 'BK-1003',
    user_id: 'user-4',
    product_id: '3',
    product_name: 'Clariti 1 Day (30 Lenses)',
    quantity: 15,
    status: 'waiting',
    points_earned: 6000,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    optometrist_name: 'Dr. Amit Sharma'
  }
];

// Mock state persistence
const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'new-booking' | 'history' | 'rewards'>('dashboard');
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Data State (Simulating DB)
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [bookings, setBookings] = useState<Booking[]>(MOCK_BOOKINGS);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

  // Simulation of initial load
  useEffect(() => {
    const savedUser = localStorage.getItem('app_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('app_user');
    setUser(null);
  };

  const handleLogin = (userData: User) => {
    localStorage.setItem('app_user', JSON.stringify(userData));
    setUser(userData);
  };

  if (!user) {
    if (isRegistering) {
      return <RegistrationView onRegister={handleLogin} onSwitchToLogin={() => setIsRegistering(false)} />;
    }
    return <LoginView onLogin={handleLogin} onSwitchToRegister={() => setIsRegistering(true)} />;
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

  // Mobile App Routes
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
            onBookingSubmit={(b) => {
              setBookings([b, ...bookings]);
              setActiveTab('history');
            }} 
          />
        )}
        {activeTab === 'history' && <MyBookings bookings={bookings.filter(b => b.user_id === user.id)} />}
        {activeTab === 'rewards' && (
          <Rewards 
            user={user} 
            bookings={bookings} 
            withdrawals={withdrawals}
            onWithdraw={(w) => setWithdrawals([w, ...withdrawals])}
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
