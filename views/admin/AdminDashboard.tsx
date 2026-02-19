
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
      val: props.bookings.filter(b => b.status === 'approved' && new Date(b.created_at).toLocaleDateString() === date).length
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

  const uniquePartners = useMemo(() => {
    const partnersMap = new Map();
    props.bookings.forEach(b => {
      if (!partnersMap.has(b.user_id)) {
        partnersMap.set(b.user_id, {
          user_id: b.user_id,
          name: b.optometrist_name || 'Unknown',
          total_orders: props.bookings.filter(ob => ob.user_id === b.user_id).length,
          total_points: props.bookings.filter(ob => ob.user_id === b.user_id && ob.status === 'approved').reduce((s, ob) => s + ob.points_earned, 0)
        });
      }
    });
    return Array.from(partnersMap.values());
  }, [props.bookings]);

  const handleUpdateStatus = async (id: string, status: BookingStatus) => {
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    if (!error) props.setBookings(prev => prev.map(b => b.id === id ? { ...b, status: status } : b));
  };

  return (
    <div className="flex h-screen bg-slate-50 w-full overflow-hidden">
      <aside className="w-72 bg-[#005696] hidden lg:flex flex-col p-8 gap-8 shadow-2xl z-40">
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
        <header className="bg-white px-8 py-5 border-b flex justify-between items-center z-30 shadow-sm lg:hidden">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#005696] rounded-lg flex items-center justify-center text-white font-black text-xs">CV</div>
              <h1 className="font-black uppercase text-sm tracking-tighter">Admin Portal</h1>
           </div>
           <button onClick={props.onLogout} className="p-2 text-slate-400"><ICONS.X className="w-5 h-5" /></button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-12">
          {view === 'overview' && (
            <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight">Master Overview</h2>
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1 italic">Real-time performance metrics</p>
                </div>
                <div className="flex flex-wrap gap-3">
                   <button onClick={() => downloadCSV(props.bookings, 'bookings_report')} className="px-5 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 shadow-sm transition-all flex items-center gap-2">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                     Bookings CSV
                   </button>
                   <button onClick={() => downloadCSV(uniquePartners, 'partners_report')} className="px-5 py-3 bg-[#005696] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-800 shadow-xl shadow-blue-900/10 transition-all flex items-center gap-2">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                     Partners CSV
                   </button>
                </div>
              </header>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatBox label="Active Waitlist" val={props.bookings.filter(b => b.status === 'waiting').length} color="amber" />
                <StatBox label="Total Partners" val={new Set(props.bookings.map(b => b.user_id)).size} color="blue" />
                <StatBox label="Rewards Disbursed" val={props.bookings.filter(b => b.status === 'approved').reduce((s, b) => s + b.points_earned, 0)} suffix="pts" color="emerald" />
                <StatBox label="Open Payouts" val={props.withdrawals.filter(w => w.status === 'pending').length} color="rose" />
              </div>

              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8 px-2">Approved Orders Trend (7D)</h3>
                <div className="h-80 w-full" style={{ minWidth: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                      <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} />
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
                <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Verification Queue</h2>
                <span className="text-[10px] font-black bg-amber-50 text-amber-600 border border-amber-100 px-4 py-2 rounded-full uppercase tracking-widest">{props.bookings.filter(b => b.status === 'waiting').length} ITEMS PENDING</span>
              </header>
              <div className="grid gap-4">
                {props.bookings.filter(b => b.status === 'waiting').length === 0 ? (
                   <div className="py-32 text-center text-slate-300 font-black italic text-sm uppercase tracking-widest border-2 border-dashed border-slate-100 rounded-[40px]">Queue clear. Good job!</div>
                ) : (
                   props.bookings.filter(b => b.status === 'waiting').map(b => (
                    <div key={b.id} className="bg-white p-6 rounded-[35px] border border-slate-100 flex flex-col md:flex-row justify-between items-center shadow-sm gap-6 hover:border-[#005696] transition-colors group">
                      <div className="flex gap-6 items-center flex-1">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-[#005696] font-black text-2xl group-hover:bg-blue-50 transition-colors">{b.quantity}</div>
                        <div>
                          <p className="font-black text-slate-900 text-lg leading-none">{b.product_name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{b.optometrist_name} • Ref: {b.id}</p>
                          {b.bill_image_url ? (
                             <a href={b.bill_image_url} target="_blank" className="inline-flex items-center gap-2 text-[10px] text-[#005696] font-black uppercase underline mt-2 hover:text-blue-800">
                               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                               Verify Bill Slip
                             </a>
                          ) : (
                             <span className="text-[9px] font-black text-red-400 uppercase tracking-widest mt-2 block">No Slip Uploaded</span>
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
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Configure unit points & pricing</p>
                </div>
                <button onClick={() => setShowProductForm(true)} className="px-8 py-4 bg-[#005696] text-white rounded-2xl text-[10px] font-black uppercase shadow-2xl shadow-blue-900/30 hover:scale-105 active:scale-95 transition-all">Add Lens Model</button>
              </header>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                {props.products.map(p => (
                  <div key={p.id} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative group hover:shadow-xl hover:border-blue-100 transition-all">
                    <div className={`absolute top-6 right-6 w-3 h-3 rounded-full ${p.active ? 'bg-emerald-500' : 'bg-slate-300'} ring-4 ring-white shadow-sm`}></div>
                    <p className="text-[10px] font-black text-[#005696] uppercase tracking-[0.2em]">{p.brand}</p>
                    <h4 className="text-lg font-black text-slate-900 mt-2 mb-6 leading-tight h-12 overflow-hidden line-clamp-2">{p.product_name}</h4>
                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-50">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Unit Price</p>
                        <p className="text-lg font-black text-slate-800">₹{p.base_price || 0}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Reward</p>
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

      {showProductForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-lg rounded-[50px] p-10 shadow-2xl relative overflow-hidden border border-white/20">
              <div className="flex justify-between items-center mb-8">
                 <div className="flex flex-col">
                   <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase">Catalog Entry</h3>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Create new lens record</span>
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
                  alert("Error adding product to database.");
                }
              }} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Manufacturer" name="pbrand" defaultValue="CooperVision" placeholder="CooperVision" />
                    <Input label="Model Title" name="pname" required placeholder="e.g. MyDay" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <Input label="Unit Price (₹)" name="pprice" type="number" required placeholder="0" />
                    <Input label="Reward Points" name="ppoints" type="number" required placeholder="0" />
                 </div>
                 
                 <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-[28px] border-2 border-slate-50 transition-all group">
                    <div className="relative flex items-center">
                      <input name="pactive" type="checkbox" id="pactive" defaultChecked className="w-6 h-6 accent-[#005696] cursor-pointer rounded-lg shadow-sm" />
                    </div>
                    <label htmlFor="pactive" className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em] cursor-pointer select-none">Active in Reward App</label>
                 </div>

                 <button type="submit" className="w-full py-6 bg-[#005696] text-white rounded-[30px] font-black text-lg uppercase tracking-widest shadow-2xl shadow-blue-900/30 active:scale-95 transition-all">Save to Catalog</button>
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
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100'
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
    <input {...props} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-[#005696] focus:bg-white font-black text-slate-800 transition-all" />
  </div>
);

export default AdminDashboard;
