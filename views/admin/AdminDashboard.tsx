
import React, { useState } from 'react';
import { User, Booking, Product, Withdrawal, BookingStatus, WithdrawalStatus } from '../../types';
import { COLORS, ICONS } from '../../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
  bookings: Booking[];
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  withdrawals: Withdrawal[];
  setWithdrawals: React.Dispatch<React.SetStateAction<Withdrawal[]>>;
}

const AdminDashboard: React.FC<AdminDashboardProps> = (props) => {
  const [view, setView] = useState<'overview' | 'bookings' | 'products' | 'withdrawals' | 'deployment'>('overview');

  const stats = [
    { label: 'Pending Bookings', value: props.bookings.filter(b => b.status === 'waiting').length, color: 'bg-amber-100 text-amber-700' },
    { label: 'Total Optometrists', value: 124, color: 'bg-blue-100 text-blue-700' },
    { label: 'Points Redeemed', value: props.withdrawals.filter(w => w.status === 'approved').reduce((s, w) => s + w.points, 0), color: 'bg-emerald-100 text-emerald-700' },
    { label: 'Revenue Generated', value: '₹4.2L', color: 'bg-slate-100 text-slate-700' }
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col p-6 space-y-8">
        <div>
          <h1 className="text-xl font-black text-[#005696] tracking-tighter">COOPERVISION<br/><span className="text-slate-400 text-sm font-bold uppercase tracking-widest">Admin Panel</span></h1>
        </div>

        <nav className="flex-1 space-y-1">
          <SidebarLink icon={<ICONS.Dashboard className="w-5 h-5"/>} label="Overview" active={view === 'overview'} onClick={() => setView('overview')} />
          <SidebarLink icon={<ICONS.History className="w-5 h-5"/>} label="Bookings" active={view === 'bookings'} onClick={() => setView('bookings')} />
          <SidebarLink icon={<ICONS.Booking className="w-5 h-5"/>} label="Products" active={view === 'products'} onClick={() => setView('products')} />
          <SidebarLink icon={<ICONS.Rewards className="w-5 h-5"/>} label="Withdrawals" active={view === 'withdrawals'} onClick={() => setView('withdrawals')} />
          <div className="pt-4 mt-4 border-t border-slate-100">
            <SidebarLink icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"/></svg>} label="Deployment" active={view === 'deployment'} onClick={() => setView('deployment')} />
          </div>
        </nav>

        <div className="pt-6 border-t">
          <button onClick={props.onLogout} className="flex items-center gap-2 text-red-500 font-bold text-sm hover:translate-x-1 transition-transform">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 capitalize">{view}</h2>
            <p className="text-slate-400 text-sm">Managing CooperVision Partner Ecosystem</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold">{props.user.full_name}</p>
              <p className="text-xs text-slate-400">Master Admin</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#005696] flex items-center justify-center text-white font-bold">SA</div>
          </div>
        </header>

        {view === 'overview' && <OverviewView stats={stats} bookings={props.bookings} />}
        {view === 'bookings' && <BookingsTable bookings={props.bookings} setBookings={props.setBookings} />}
        {view === 'products' && <ProductManager products={props.products} setProducts={props.setProducts} />}
        {view === 'withdrawals' && <WithdrawalsTable withdrawals={props.withdrawals} setWithdrawals={props.setWithdrawals} />}
        {view === 'deployment' && <DeploymentView />}
      </main>
    </div>
  );
};

const SidebarLink = ({ icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${active ? 'bg-[#005696] text-white shadow-lg shadow-blue-900/10' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}>
    {icon}
    {label}
  </button>
);

const DeploymentView = () => (
  <div className="max-w-4xl space-y-8">
    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <span className="w-8 h-8 rounded-lg bg-blue-100 text-[#005696] flex items-center justify-center text-sm">1</span>
        Cloud Hosting (Public Link)
      </h3>
      <div className="space-y-4 text-sm text-slate-600">
        <p>To make this link accessible to your 10 users:</p>
        <ol className="list-decimal list-inside space-y-2 ml-4">
          <li>Create a free account at <b>Vercel.com</b> or <b>Netlify.com</b>.</li>
          <li>Connect your GitHub repository containing these files.</li>
          <li>It will automatically give you a link like <code className="bg-slate-100 px-1 rounded text-[#005696]">https://coopervision-rewards.vercel.app</code>.</li>
        </ol>
      </div>
    </div>

    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <span className="w-8 h-8 rounded-lg bg-blue-100 text-[#005696] flex items-center justify-center text-sm">2</span>
        WhatsApp Automation Steps
      </h3>
      <div className="space-y-4 text-sm text-slate-600">
        <p>To automate WhatsApp alerts to your number:</p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>Register at <b>developers.facebook.com</b>.</li>
          <li>Create a "Business App" and enable the <b>WhatsApp Cloud API</b>.</li>
          <li>Add your phone number (vk_nalla's) as the "Test Number" or "Recipient".</li>
          <li>Get your <b>Permanent Access Token</b>.</li>
          <li>Update the <code className="bg-slate-100 px-1 rounded text-[#005696]">notificationService.ts</code> file with your API credentials.</li>
        </ul>
      </div>
    </div>

    <div className="bg-[#005696] p-8 rounded-3xl text-white">
      <h3 className="font-bold mb-4">Final Production Recommendation</h3>
      <p className="text-sm opacity-90 leading-relaxed">
        For a production app, do not store users in React state (which resets on refresh). 
        Setup a <b>Supabase</b> project. It provides built-in OTP login, Secure Row Level Security, and image storage for your bills.
      </p>
    </div>
  </div>
);

// ... (Rest of the existing components: OverviewView, BookingsTable, ProductManager, WithdrawalsTable)
const OverviewView = ({ stats, bookings }: any) => {
  const chartData = [
    { name: 'Mon', bookings: 12 },
    { name: 'Tue', bookings: 19 },
    { name: 'Wed', bookings: 15 },
    { name: 'Thu', bookings: 22 },
    { name: 'Fri', bookings: 30 },
    { name: 'Sat', bookings: 10 },
    { name: 'Sun', bookings: 5 },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-4 gap-6">
        {stats.map((s: any) => (
          <div key={s.label} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase mb-2">{s.label}</p>
            <p className={`text-3xl font-black ${s.color.split(' ')[1]}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm h-96">
          <h3 className="font-bold text-slate-800 mb-6">Booking Velocity (Weekly)</h3>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
              <Bar dataKey="bookings" fill="#005696" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm h-96 flex flex-col">
          <h3 className="font-bold text-slate-800 mb-6">Recent Status</h3>
          <div className="flex-1 space-y-4 overflow-y-auto pr-2">
            {bookings.slice(0, 5).map((b: any) => (
              <div key={b.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className={`w-2 h-2 rounded-full ${b.status === 'approved' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <div className="flex-1">
                  <p className="text-xs font-bold truncate">{b.optometrist_name}</p>
                  <p className="text-[10px] text-slate-400">{b.product_name}</p>
                </div>
                <p className="text-[10px] font-black text-[#005696]">+{b.points_earned} pts</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const BookingsTable = ({ bookings, setBookings }: any) => {
  const updateStatus = (id: string, status: BookingStatus) => {
    setBookings(bookings.map((b: Booking) => b.id === id ? { ...b, status } : b));
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>
            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase">Partner</th>
            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase">Product</th>
            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase text-center">Qty</th>
            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase">Status</th>
            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {bookings.map((b: Booking) => (
            <tr key={b.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-800">{b.optometrist_name}</span>
                  <span className="text-[10px] text-slate-400">{new Date(b.created_at).toLocaleString()}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-sm font-medium">{b.product_name}</td>
              <td className="px-6 py-4 text-sm font-bold text-center">{b.quantity}</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${b.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : b.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                  {b.status}
                </span>
              </td>
              <td className="px-6 py-4">
                {b.status === 'waiting' && (
                  <div className="flex gap-2">
                    <button onClick={() => updateStatus(b.id, 'approved')} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100"><ICONS.Check className="w-4 h-4"/></button>
                    <button onClick={() => updateStatus(b.id, 'rejected')} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><ICONS.X className="w-4 h-4"/></button>
                  </div>
                )}
              </td>
            </tr>
          ))}
          {bookings.length === 0 && (
            <tr>
              <td colSpan={5} className="py-20 text-center text-slate-400 italic">No bookings waiting for review</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const ProductManager = ({ products, setProducts }: any) => {
  const [newP, setNewP] = useState({ name: '', points: 500 });

  const addProduct = () => {
    if (!newP.name) return;
    const prod: Product = {
      id: Math.random().toString(36).substr(2, 9),
      brand: 'CooperVision',
      product_name: newP.name,
      points_per_unit: newP.points,
      active: true
    };
    setProducts([...products, prod]);
    setNewP({ name: '', points: 500 });
  };

  const deleteProduct = (id: string) => {
    setProducts(products.filter((p: Product) => p.id !== id));
  };

  return (
    <div className="grid grid-cols-3 gap-8">
      <div className="col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase">Product Name</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase">Points</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase text-right">Delete</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {products.map((p: Product) => (
              <tr key={p.id} className="text-sm font-medium">
                <td className="px-6 py-4">{p.product_name}</td>
                <td className="px-6 py-4 font-bold text-[#005696]">{p.points_per_unit}</td>
                <td className="px-6 py-4">
                  <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${p.active ? 'bg-emerald-500 flex justify-end' : 'bg-slate-200 flex justify-start'}`}>
                    <div className="w-3 h-3 bg-white rounded-full shadow-sm" />
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => deleteProduct(p.id)} className="text-red-400 hover:text-red-600 transition-colors">
                    <ICONS.X className="w-5 h-5 ml-auto" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">Add New Product</h3>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Name</label>
              <input type="text" value={newP.name} onChange={e => setNewP({...newP, name: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Points per unit</label>
              <input type="number" value={newP.points} onChange={e => setNewP({...newP, points: parseInt(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <button onClick={addProduct} className="w-full py-3 bg-[#005696] text-white font-bold rounded-xl shadow-lg shadow-blue-900/10">Add Product</button>
          </div>
        </div>

        <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex flex-col items-center text-center">
          <svg className="w-8 h-8 text-blue-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
          <p className="text-xs font-bold text-blue-700">Bulk Upload CSV/Excel</p>
          <p className="text-[10px] text-blue-500 mt-1">Upload multiple products at once</p>
          <button className="mt-4 px-4 py-2 bg-white text-blue-600 rounded-lg text-xs font-black border border-blue-200">Choose File</button>
        </div>
      </div>
    </div>
  );
};

const WithdrawalsTable = ({ withdrawals, setWithdrawals }: any) => {
  const updateStatus = (id: string, status: WithdrawalStatus) => {
    setWithdrawals(withdrawals.map((w: Withdrawal) => w.id === id ? { ...w, status } : w));
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase">Partner ID</th>
            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase">Amount</th>
            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase">UPI ID</th>
            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase">Status</th>
            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {withdrawals.map((w: Withdrawal) => (
            <tr key={w.id} className="text-sm font-medium">
              <td className="px-6 py-4">USR-{w.user_id.substr(0,4)}</td>
              <td className="px-6 py-4 font-bold text-slate-800">₹{w.amount}</td>
              <td className="px-6 py-4 font-mono text-xs">{w.upi_id}</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${w.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {w.status}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                {w.status === 'pending' && (
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => updateStatus(w.id, 'approved')} className="px-3 py-1 bg-emerald-500 text-white rounded text-[10px] font-bold">Approve Payment</button>
                    <button onClick={() => updateStatus(w.id, 'rejected')} className="px-3 py-1 bg-slate-200 text-slate-600 rounded text-[10px] font-bold">Reject</button>
                  </div>
                )}
              </td>
            </tr>
          ))}
          {withdrawals.length === 0 && (
            <tr>
              <td colSpan={5} className="py-20 text-center text-slate-400 italic">No redemption requests at the moment</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDashboard;
