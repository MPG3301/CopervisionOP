
import React, { useState, useMemo } from 'react';
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
      return d.toLocaleDateString('en-GB'); 
    }).reverse();

    return last7Days.map(date => ({
      name: date.substring(0, 5),
      val: props.bookings.filter(b => {
        if (!b.created_at) return false;
        return b.status === 'approved' && new Date(b.created_at).toLocaleDateString('en-GB') === date;
      }).length
    }));
  }, [props.bookings]);

  const handleUpdateStatus = async (id: string, status: BookingStatus) => {
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    if (!error) {
      props.setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 w-full overflow-hidden flex-col lg:flex-row">
      {/* DESKTOP SIDEBAR */}
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

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* MOBILE HEADER */}
        <header className="bg-white px-6 py-5 border-b flex justify-between items-center z-30 shadow-sm lg:hidden shrink-0">
           <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#005696] rounded-xl flex items-center justify-center text-white font-black text-xs">CV</div>
              <div className="flex flex-col">
                <h1 className="font-black uppercase text-xs tracking-tighter text-[#005696]">Admin Portal</h1>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{view.toUpperCase()}</span>
              </div>
           </div>
           <button onClick={props.onLogout} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:text-red-500 transition-colors">
             <ICONS.X className="w-5 h-5" />
           </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-12 pb-24 lg:pb-12">
          {view === 'overview' && (
            <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
              <header>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Master Overview</h2>
                <p className="text-slate-400 font-bold uppercase text-[9px] tracking-[0.2em] mt-1">Real-time stats</p>
              </header>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatBox label="Waiting" val={props.bookings.filter(b => b.status === 'waiting').length} color="amber" />
                <StatBox label="Partners" val={new Set(props.bookings.map(b => b.user_id)).size} color="blue" />
                <StatBox label="Reward Pts" val={props.bookings.filter(b => b.status === 'approved').reduce((s, b) => s + b.points_earned, 0)} color="emerald" />
                <StatBox label="Open Payouts" val={props.withdrawals.filter(w => w.status === 'pending').length} color="rose" />
              </div>

              <div className="bg-white p-6 md:p-8 rounded-[40px] border border-slate-100 shadow-sm">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Approved Orders (7D)</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} />
                      <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                      <Line type="monotone" dataKey="val" stroke="#005696" strokeWidth={4} dot={{ r: 4, fill: '#005696' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {view === 'bookings' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <header className="flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Waitlist Review</h2>
                  <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mt-1">Verify incoming sales</p>
                </div>
              </header>
              <div className="space-y-4">
                {props.bookings.filter(b => b.status === 'waiting').length === 0 ? (
                   <div className="py-24 text-center text-slate-300 font-black italic text-xs uppercase border-2 border-dashed border-slate-100 rounded-[30px]">No pending items</div>
                ) : (
                   props.bookings.filter(b => b.status === 'waiting').map(b => (
                    <div key={b.id} className="bg-white p-5 rounded-[30px] border border-slate-100 shadow-sm flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-black text-slate-900 text-base">{b.product_name}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">By {b.optometrist_name || 'Partner'}</p>
                        </div>
                        <div className="bg-blue-50 px-3 py-1 rounded-full text-[#005696] font-black text-[10px]">{b.quantity} Packs</div>
                      </div>
                      
                      <div className="flex gap-2">
                        {b.bill_image_url && (
                          <a href={b.bill_image_url} target="_blank" className="flex-1 py-2.5 bg-slate-50 text-[#005696] rounded-xl text-[9px] font-black uppercase text-center border border-blue-100">View Slip</a>
                        )}
                        <button onClick={() => handleUpdateStatus(b.id, 'approved')} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase shadow-lg shadow-emerald-100">Approve</button>
                        <button onClick={() => handleUpdateStatus(b.id, 'rejected')} className="flex-1 py-2.5 bg-slate-100 text-slate-400 rounded-xl text-[9px] font-black uppercase">Reject</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {view === 'products' && (
            <div className="max-w-5xl mx-auto space-y-8">
              <header className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Lens Catalog</h2>
                <button onClick={() => setShowProductForm(true)} className="p-3 bg-[#005696] text-white rounded-xl shadow-lg shadow-blue-900/30">
                  <ICONS.Booking className="w-5 h-5" />
                </button>
              </header>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {props.products.map(p => (
                  <div key={p.id} className="bg-white p-6 rounded-[35px] border border-slate-100 shadow-sm flex justify-between items-center">
                    <div>
                      <p className="text-[8px] font-black text-[#005696] uppercase tracking-widest">{p.brand}</p>
                      <h4 className="text-sm font-black text-slate-900 mt-1">{p.product_name}</h4>
                      <p className="text-xs font-bold text-slate-400 mt-2">₹{p.base_price} • {p.points_per_unit} pts</p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${p.active ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-slate-300'}`}></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'withdrawals' && (
             <div className="max-w-4xl mx-auto space-y-6">
                <header>
                   <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Redemptions</h2>
                   <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mt-1 italic">Process UPI payouts</p>
                </header>
                <div className="space-y-4">
                   {props.withdrawals.length === 0 ? (
                      <div className="py-24 text-center text-slate-300 font-black italic text-xs border-2 border-dashed border-slate-100 rounded-[30px]">No payout requests</div>
                   ) : (
                      props.withdrawals.map(w => (
                         <div key={w.id} className="bg-white p-5 rounded-[30px] border border-slate-100 shadow-sm flex flex-col gap-4">
                            <div className="flex justify-between items-center">
                               <div>
                                  <p className="text-lg font-black text-slate-900">₹{w.amount}</p>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{w.upi_id}</p>
                               </div>
                               <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${w.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{w.status}</span>
                            </div>
                            {w.status === 'pending' && (
                               <div className="flex gap-2">
                                  <button className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase shadow-xl shadow-slate-900/30">Confirm Payout</button>
                                  <button className="flex-1 py-3 bg-slate-50 text-slate-300 rounded-xl text-[9px] font-black uppercase">Cancel</button>
                               </div>
                            )}
                         </div>
                      ))
                   )}
                </div>
             </div>
          )}
        </main>

        {/* MOBILE BOTTOM NAV */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t flex justify-around p-3 pb-8 z-50 lg:hidden shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
           <AdminNavItem active={view === 'overview'} label="Dashboard" icon={<ICONS.Dashboard className="w-6 h-6" />} onClick={() => setView('overview')} />
           <AdminNavItem active={view === 'bookings'} label="Waitlist" icon={<ICONS.History className="w-6 h-6" />} onClick={() => setView('bookings')} />
           <AdminNavItem active={view === 'products'} label="Catalog" icon={<ICONS.Booking className="w-6 h-6" />} onClick={() => setView('products')} />
           <AdminNavItem active={view === 'withdrawals'} label="Redemptions" icon={<ICONS.Rewards className="w-6 h-6" />} onClick={() => setView('withdrawals')} />
        </nav>
      </div>

      {showProductForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-lg rounded-[40px] p-8 shadow-2xl relative">
              <button onClick={() => setShowProductForm(false)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-xl"><ICONS.X className="w-5 h-5"/></button>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-6">New Catalog Item</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const target = e.target as any;
                const payload = { 
                  product_name: target.pname.value,
                  brand: target.pbrand.value || 'CooperVision',
                  base_price: parseInt(target.pprice.value),
                  points_per_unit: parseInt(target.ppoints.value),
                  active: true
                };
                const { data, error } = await supabase.from('products').insert([payload]).select();
                if (!error && data) {
                  props.setProducts(prev => [...prev, ...data]);
                  setShowProductForm(false);
                }
              }} className="space-y-4">
                 <Input label="Manufacturer" name="pbrand" defaultValue="CooperVision" />
                 <Input label="Lens Title" name="pname" required />
                 <div className="grid grid-cols-2 gap-4">
                   <Input label="Price (₹)" name="pprice" type="number" required />
                   <Input label="Reward Pts" name="ppoints" type="number" required />
                 </div>
                 <button type="submit" className="w-full py-5 bg-[#005696] text-white rounded-2xl font-black text-sm uppercase tracking-widest mt-4">Save Product</button>
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

const AdminNavItem = ({ active, label, icon, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1.5 transition-all ${active ? 'text-[#005696] scale-105' : 'text-slate-300'}`}>
    {icon} <span className="text-[8px] font-black uppercase tracking-wider text-center">{label}</span>
  </button>
);

const StatBox = ({ label, val, color }: any) => {
  const c: Record<string, string> = {
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600'
  };
  return (
    <div className={`p-6 rounded-[30px] border border-slate-100 ${c[color]} flex flex-col items-start shadow-sm`}>
      <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">{label}</p>
      <p className="text-2xl font-black tracking-tighter">{val}</p>
    </div>
  );
};

const Input = ({ label, ...props }: any) => (
  <div className="space-y-1">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <input {...props} className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-50 rounded-xl outline-none focus:border-[#005696] font-bold text-slate-800 transition-all text-sm" />
  </div>
);

export default AdminDashboard;
