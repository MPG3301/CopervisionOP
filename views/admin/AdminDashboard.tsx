
import React, { useState, useRef, useMemo } from 'react';
import { User, Booking, Product, Withdrawal, BookingStatus } from '../../types';
import { ICONS } from '../../constants';
import { supabase } from '../../lib/supabase';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, YAxis } from 'recharts';

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
    if (data.length === 0) return alert("No data available to export");
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).map(v => `"${v}"`).join(','));
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleUpdateStatus = async (id: string, status: BookingStatus) => {
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    if (!error) props.setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  };

  return (
    <div className="flex h-screen bg-slate-50 w-full overflow-hidden">
      {/* Sidebar: PC/Tab Only */}
      <aside className="w-72 bg-[#005696] hidden md:flex flex-col p-8 gap-8 shadow-2xl z-40">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#005696] font-black text-xl shadow-lg">CV</div>
          <div className="flex flex-col">
            <h1 className="text-white font-black uppercase tracking-tighter text-lg leading-none">Admin Hub</h1>
            <span className="text-[10px] text-white/50 font-black uppercase tracking-[0.2em] mt-1">Management Suite</span>
          </div>
        </div>
        
        <nav className="flex flex-col gap-2">
          <SidebarItem active={view === 'overview'} label="Dashboard" icon={<ICONS.Dashboard className="w-5 h-5"/>} onClick={() => setView('overview')} />
          <SidebarItem active={view === 'bookings'} label="Waitlist Review" icon={<ICONS.History className="w-5 h-5"/>} onClick={() => setView('bookings')} />
          <SidebarItem active={view === 'products'} label="Lens Catalog" icon={<ICONS.Booking className="w-5 h-5"/>} onClick={() => setView('products')} />
          <SidebarItem active={view === 'withdrawals'} label="Redemptions" icon={<ICONS.Rewards className="w-5 h-5"/>} onClick={() => setView('withdrawals')} />
        </nav>

        <div className="mt-auto pt-8 border-t border-white/10">
           <button onClick={props.onLogout} className="flex items-center gap-4 px-4 py-3 w-full rounded-2xl text-white/60 hover:text-red-400 transition-colors font-black text-sm uppercase">
              <ICONS.X className="w-5 h-5" /> Logout
           </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white px-8 py-5 border-b flex justify-between items-center z-30 shadow-sm md:hidden">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#005696] rounded-lg flex items-center justify-center text-white font-black text-xs">CV</div>
              <h1 className="font-black uppercase text-sm tracking-tighter">Admin Portal</h1>
           </div>
           <button onClick={props.onLogout} className="p-2 text-slate-400"><ICONS.X className="w-5 h-5" /></button>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-12">
          {view === 'overview' && (
            <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight">Master Overview</h2>
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1 italic">Real-time performance metrics</p>
                </div>
                <div className="flex gap-3">
                   <button onClick={() => downloadCSV(props.bookings, 'cv_bookings_export')} className="px-5 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 shadow-sm transition-all">Export Bookings</button>
                </div>
              </header>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatBox label="Active Queue" val={props.bookings.filter(b => b.status === 'waiting').length} color="amber" />
                <StatBox label="Partner Base" val={new Set(props.bookings.map(b => b.user_id)).size} color="blue" />
                <StatBox label="Approved Rewards" val={props.bookings.filter(b => b.status === 'approved').reduce((s, b) => s + b.points_earned, 0)} suffix="pts" color="emerald" />
                <StatBox label="Pending Payouts" val={props.withdrawals.filter(w => w.status === 'pending').length} color="rose" />
              </div>

              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8 px-2">7-Day Sales Volume</h3>
                <div className="h-72 w-full" style={{ minWidth: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                      <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                      <Line type="monotone" dataKey="val" stroke="#005696" strokeWidth={5} dot={{ r: 6, fill: '#005696', stroke: '#fff', strokeWidth: 3 }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {view === 'bookings' && (
            <div className="max-w-5xl mx-auto space-y-6">
              <header className="flex justify-between items-end">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Waitlist Queue</h2>
                <span className="text-[10px] font-black bg-amber-50 text-amber-600 border border-amber-100 px-4 py-2 rounded-full uppercase tracking-widest">{props.bookings.filter(b => b.status === 'waiting').length} NEW ITEMS</span>
              </header>
              <div className="grid gap-4">
                {props.bookings.filter(b => b.status === 'waiting').length === 0 ? (
                   <div className="py-24 text-center text-slate-300 font-black italic text-sm uppercase tracking-widest border-2 border-dashed border-slate-100 rounded-[40px]">Queue is empty</div>
                ) : (
                   props.bookings.filter(b => b.status === 'waiting').map(b => (
                    <div key={b.id} className="bg-white p-6 rounded-[35px] border border-slate-100 flex flex-col md:flex-row justify-between items-center shadow-sm gap-6 hover:border-[#005696] transition-colors">
                      <div className="flex gap-6 items-center flex-1">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-[#005696] font-black text-2xl">{b.quantity}</div>
                        <div>
                          <p className="font-black text-slate-900 text-lg leading-none">{b.product_name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{b.optometrist_name} • Order ID: {b.id}</p>
                          {b.bill_image_url && (
                             <a href={b.bill_image_url} target="_blank" className="inline-flex items-center gap-2 text-[10px] text-[#005696] font-black uppercase underline mt-2 hover:text-blue-800">
                               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                               Verify Bill Slip
                             </a>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-3 w-full md:w-auto">
                        <button onClick={() => handleUpdateStatus(b.id, 'approved')} className="flex-1 md:flex-none px-8 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-emerald-100 active:scale-95 transition-all">Approve</button>
                        <button onClick={() => handleUpdateStatus(b.id, 'rejected')} className="flex-1 md:flex-none px-8 py-4 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black uppercase hover:text-red-500 active:scale-95 transition-all">Reject</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {view === 'products' && (
            <div className="max-w-6xl mx-auto space-y-10">
              <header className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Lens Catalog</h2>
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Manage points and pricing</p>
                </div>
                <button onClick={() => setShowProductForm(true)} className="px-8 py-4 bg-[#005696] text-white rounded-2xl text-[10px] font-black uppercase shadow-2xl shadow-blue-900/30 hover:scale-105 active:scale-95 transition-all">New Product</button>
              </header>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {props.products.map(p => (
                  <div key={p.id} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative group hover:shadow-xl hover:border-blue-100 transition-all">
                    <div className={`absolute top-6 right-6 w-3 h-3 rounded-full ${p.active ? 'bg-emerald-500' : 'bg-slate-300'} ring-4 ring-white shadow-sm`}></div>
                    <p className="text-[10px] font-black text-[#005696] uppercase tracking-[0.2em]">{p.brand}</p>
                    <h4 className="text-lg font-black text-slate-900 mt-2 mb-6 leading-tight">{p.product_name}</h4>
                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-50">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Unit Price</p>
                        <p className="text-lg font-black text-slate-800">₹{p.base_price || 0}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Rewards</p>
                        <p className="text-lg font-black text-[#005696]">{p.points_per_unit} pts</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* REFINED MODAL: Centered, Contained, Polished */}
      {showProductForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-lg rounded-[50px] p-12 shadow-2xl relative overflow-hidden border border-white/20">
              <div className="flex justify-between items-center mb-10">
                 <div className="flex flex-col">
                   <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase">Product Editor</h3>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Update catalog records</span>
                 </div>
                 <button onClick={() => setShowProductForm(false)} className="w-12 h-12 flex items-center justify-center bg-slate-50 rounded-2xl text-slate-400 hover:text-red-500 transition-all active:scale-90"><ICONS.X className="w-6 h-6" /></button>
              </div>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                const target = e.target as any;
                const payload = { 
                  product_name: target.pname.value,
                  brand: target.pbrand.value || 'CooperVision',
                  base_price: parseInt(target.pprice.value),
                  points_per_unit: parseInt(target.ppoints.value),
                  active: target.pactive.checked
                };
                const { data, error } = await supabase.from('products').insert([payload]).select();
                if (!error && data) {
                  props.setProducts(prev => [...prev, ...data]);
                  setShowProductForm(false);
                } else {
                  alert("Error adding product. Ensure table schema is correct.");
                }
              }} className="space-y-8">
                 <div className="grid grid-cols-2 gap-6">
                    <Input label="Manufacturer" name="pbrand" defaultValue="CooperVision" placeholder="CooperVision" />
                    <Input label="Model Title" name="pname" required placeholder="e.g. Biofinity" />
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <Input label="Price (₹)" name="pprice" type="number" required placeholder="0" />
                    <Input label="Points Per Unit" name="ppoints" type="number" required placeholder="0" />
                 </div>
                 
                 <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-[28px] border-2 border-slate-50 transition-all group focus-within:border-blue-100">
                    <div className="relative flex items-center">
                      <input name="pactive" type="checkbox" id="pactive" defaultChecked className="w-6 h-6 accent-[#005696] cursor-pointer rounded-lg shadow-sm" />
                    </div>
                    <label htmlFor="pactive" className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em] cursor-pointer select-none">Mark Item as Active in App</label>
                 </div>

                 <button type="submit" className="w-full py-6 bg-[#005696] text-white rounded-[30px] font-black text-lg uppercase tracking-widest shadow-2xl shadow-blue-900/30 active:scale-95 transition-all">Add to Catalog</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

const SidebarItem = ({ active, label, icon, onClick }: any) => (
  <button onClick={onClick} className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-black text-sm uppercase tracking-widest ${active ? 'bg-white/15 text-white shadow-lg' : 'text-white/40 hover:text-white/80 hover:bg-white/5'}`}>
    {icon} <span>{label}</span>
  </button>
);

const StatBox = ({ label, val, color, suffix }: any) => {
  const c: Record<string, string> = {
    amber: 'bg-amber-50 text-amber-600 border-amber-100 shadow-amber-500/5',
    blue: 'bg-blue-50 text-blue-600 border-blue-100 shadow-blue-500/5',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-500/5',
    rose: 'bg-rose-50 text-rose-600 border-rose-100 shadow-rose-500/5'
  };
  return (
    <div className={`p-8 rounded-[40px] border-2 ${c[color]} shadow-xl flex flex-col items-start gap-1`}>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 leading-none mb-1">{label}</p>
      <p className="text-4xl font-black tracking-tighter">{val}<span className="text-sm ml-1 opacity-50">{suffix}</span></p>
    </div>
  );
};

const Input = ({ label, ...props }: any) => (
  <div className="space-y-2 flex-1">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <input {...props} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-[#005696] focus:bg-white font-black text-slate-800 transition-all shadow-sm" />
  </div>
);

export default AdminDashboard;
