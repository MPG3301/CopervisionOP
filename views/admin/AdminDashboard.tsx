
import React, { useState, useRef, useMemo } from 'react';
import { User, Booking, Product, Withdrawal, BookingStatus } from '../../types';
import { ICONS } from '../../constants';
import { supabase } from '../../lib/supabase';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

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
  const [view, setView] = useState<'overview' | 'bookings' | 'products' | 'withdrawals'>('overview');
  const [showProductForm, setShowProductForm] = useState(false);

  const chartData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString();
    }).reverse();
    return last7Days.map(date => ({
      name: date.split('/')[0] + '/' + date.split('/')[1],
      val: props.bookings.filter(b => b.status === 'approved' && new Date(b.created_at).toLocaleDateString() === date).length,
    }));
  }, [props.bookings]);

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).map(v => `"${v}"`).join(','));
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
  };

  const handleUpdateStatus = async (id: string, status: BookingStatus) => {
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    if (!error) props.setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 w-full overflow-hidden">
      <header className="bg-white px-8 py-5 border-b flex justify-between items-center z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#005696] rounded-xl flex items-center justify-center text-white font-black">CV</div>
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Admin Control</h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => downloadCSV(props.bookings, 'cv_bookings')} className="text-[10px] font-black uppercase text-slate-500 hover:text-[#005696]">Export Logs</button>
          <button onClick={props.onLogout} className="p-2 text-slate-400 hover:text-red-500"><ICONS.X className="w-6 h-6" /></button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 bg-white border-r hidden lg:flex flex-col p-6 gap-2">
          <SidebarItem active={view === 'overview'} label="Overview" icon={<ICONS.Dashboard className="w-5 h-5"/>} onClick={() => setView('overview')} />
          <SidebarItem active={view === 'bookings'} label="Waitlist" icon={<ICONS.History className="w-5 h-5"/>} onClick={() => setView('bookings')} />
          <SidebarItem active={view === 'products'} label="Catalog" icon={<ICONS.Booking className="w-5 h-5"/>} onClick={() => setView('products')} />
          <SidebarItem active={view === 'withdrawals'} label="Payouts" icon={<ICONS.Rewards className="w-5 h-5"/>} onClick={() => setView('withdrawals')} />
        </aside>

        <main className="flex-1 overflow-y-auto p-8">
          {view === 'overview' && (
            <div className="space-y-8 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatBox label="Pending Waitlist" val={props.bookings.filter(b => b.status === 'waiting').length} color="amber" />
                <StatBox label="Total Partners" val={new Set(props.bookings.map(b => b.user_id)).size} color="blue" />
                <StatBox label="Approved Rewards" val={`₹${props.bookings.filter(b => b.status === 'approved').reduce((s, b) => s + b.points_earned, 0) / 10}`} color="emerald" />
              </div>

              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Sales Volume Trend (7D)</h3>
                <div className="h-64 w-full" style={{ minWidth: 0 }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                      <Line type="monotone" dataKey="val" stroke="#005696" strokeWidth={4} dot={{ r: 6, fill: '#005696', stroke: '#fff', strokeWidth: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {view === 'bookings' && (
            <div className="space-y-4 animate-in fade-in">
              <h2 className="text-2xl font-black text-slate-900">Waitlist Review</h2>
              {props.bookings.filter(b => b.status === 'waiting').map(b => (
                <div key={b.id} className="bg-white p-6 rounded-[32px] border border-slate-100 flex justify-between items-center shadow-sm">
                  <div className="flex gap-6 items-center">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-[#005696] font-black">{b.quantity}</div>
                    <div>
                      <p className="font-black text-slate-900">{b.product_name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{b.optometrist_name}</p>
                      {b.bill_image_url && <a href={b.bill_image_url} target="_blank" className="text-[10px] text-[#005696] font-black uppercase underline mt-1 block">View Bill</a>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleUpdateStatus(b.id, 'approved')} className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase">Approve</button>
                    <button onClick={() => handleUpdateStatus(b.id, 'rejected')} className="px-6 py-3 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {view === 'products' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-slate-900">Lens Catalog</h2>
                <button onClick={() => setShowProductForm(true)} className="px-8 py-3 bg-[#005696] text-white rounded-xl text-[10px] font-black uppercase shadow-xl shadow-blue-900/20 hover:scale-105 transition-transform">+ Add Product</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {props.products.map(p => (
                  <div key={p.id} className="bg-white p-6 rounded-[35px] border border-slate-100 shadow-sm relative group">
                    <div className={`absolute top-4 right-4 w-2 h-2 rounded-full ${p.active ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                    <p className="text-[10px] font-black text-[#005696] uppercase tracking-widest">{p.brand}</p>
                    <h4 className="text-lg font-black text-slate-900 my-1">{p.product_name}</h4>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-50">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase">Unit Price</p>
                        <p className="font-black">₹{p.base_price || 0}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase">Points</p>
                        <p className="font-black text-[#005696]">{p.points_per_unit} pts</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {showProductForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in">
           <div className="bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl space-y-8 relative overflow-hidden">
              <div className="flex justify-between items-center">
                 <h3 className="text-2xl font-black text-slate-900 tracking-tight">Catalog Entry</h3>
                 <button onClick={() => setShowProductForm(false)} className="text-slate-300 hover:text-red-500"><ICONS.X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const target = e.target as any;
                const payload = { 
                  product_name: target.pname.value,
                  brand: 'CooperVision',
                  base_price: parseInt(target.pprice.value),
                  points_per_unit: parseInt(target.ppoints.value),
                  active: target.pactive.checked
                };
                const { data, error } = await supabase.from('products').insert([payload]).select();
                if (!error && data) {
                  props.setProducts(prev => [...prev, ...data]);
                  setShowProductForm(false);
                } else {
                  alert("Sync Error: Ensure table has 'base_price' column via SQL Editor.");
                }
              }} className="space-y-6">
                 <Input label="Product Title" name="pname" placeholder="e.g. Biofinity (6pk)" />
                 <div className="grid grid-cols-2 gap-4">
                    <Input label="Price (₹)" name="pprice" type="number" placeholder="2500" />
                    <Input label="Points/Unit" name="ppoints" type="number" placeholder="125" />
                 </div>
                 <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                    <input name="pactive" type="checkbox" id="pactive" defaultChecked className="w-5 h-5 accent-[#005696]" />
                    <label htmlFor="pactive" className="text-xs font-black text-slate-700 uppercase tracking-widest">Available in app</label>
                 </div>
                 <button type="submit" className="w-full py-5 bg-[#005696] text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-blue-900/20 active:scale-95 transition-all">Add to Catalog</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

const SidebarItem = ({ active, label, icon, onClick }: any) => (
  <button onClick={onClick} className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all ${active ? 'bg-blue-50 text-[#005696]' : 'text-slate-400 hover:bg-slate-50'}`}>
    {icon} <span className="font-black text-sm uppercase tracking-widest">{label}</span>
  </button>
);

const StatBox = ({ label, val, color }: any) => {
  const c: Record<string, string> = {
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100'
  };
  return (
    <div className={`p-8 rounded-[35px] border ${c[color]} shadow-sm`}>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{label}</p>
      <p className="text-3xl font-black">{val}</p>
    </div>
  );
};

const Input = ({ label, ...props }: any) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <input {...props} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-[#005696] font-bold transition-all" />
  </div>
);

export default AdminDashboard;
