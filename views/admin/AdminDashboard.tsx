
import React, { useState, useRef, useMemo } from 'react';
import { User, Booking, Product, Withdrawal, BookingStatus, WithdrawalStatus } from '../../types';
import { ICONS } from '../../constants';
import { supabase } from '../../lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

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
  const [view, setView] = useState<'overview' | 'bookings' | 'products' | 'withdrawals' | 'partners'>('overview');
  const [showProductForm, setShowProductForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sales chart data
  const chartData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString();
    }).reverse();

    return last7Days.map(date => ({
      date: date.split('/')[0] + '/' + date.split('/')[1],
      orders: props.bookings.filter(b => b.status === 'approved' && new Date(b.created_at).toLocaleDateString() === date).length,
      points: props.bookings.filter(b => b.status === 'approved' && new Date(b.created_at).toLocaleDateString() === date).reduce((s, b) => s + b.points_earned, 0)
    }));
  }, [props.bookings]);

  const exportToCSV = (type: 'bookings' | 'partners') => {
    let csvContent = "data:text/csv;charset=utf-8,";
    if (type === 'bookings') {
      csvContent += "ID,Optometrist,Product,Quantity,Points,Status,Date\n";
      props.bookings.forEach(b => {
        csvContent += `${b.id},${b.optometrist_name},${b.product_name},${b.quantity},${b.points_earned},${b.status},${new Date(b.created_at).toLocaleDateString()}\n`;
      });
    } else {
      csvContent += "ID,Name,Shop,City,Referral,Join Date\n";
      const partners = new Map();
      props.bookings.forEach(b => partners.set(b.user_id, { name: b.optometrist_name, date: b.created_at }));
      partners.forEach((v, k) => {
        csvContent += `${k},${v.name},Clinic,Mumbai,OPT-XXXXXX,${new Date(v.date).toLocaleDateString()}\n`;
      });
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CV_${type}_export.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const handleUpdateStatus = async (id: string, status: BookingStatus) => {
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    if (!error) props.setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const csv = event.target?.result as string;
      const lines = csv.split('\n').filter(l => l.trim());
      const newProds = lines.slice(1).map(line => {
        const [brand, name, points, active] = line.split(',').map(s => s.trim());
        return {
          brand: brand || 'CooperVision',
          product_name: name,
          points_per_unit: parseInt(points) || 0,
          active: active.toLowerCase() === 'true'
        };
      });
      const { data, error } = await supabase.from('products').insert(newProds).select();
      if (!error && data) props.setProducts(prev => [...prev, ...data]);
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 max-w-md mx-auto relative overflow-hidden font-sans border-x border-slate-200">
      <header className="bg-white px-6 py-5 border-b flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#005696] rounded-lg flex items-center justify-center"><ICONS.Check className="w-5 h-5 text-white" /></div>
          <div>
            <h1 className="text-sm font-black text-slate-900 tracking-tight leading-none uppercase">Admin Portal</h1>
            <p className="text-[9px] font-bold text-[#005696] tracking-widest mt-0.5">SUPER USER MODE</p>
          </div>
        </div>
        <button onClick={props.onLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><ICONS.X className="w-5 h-5" /></button>
      </header>

      <main className="flex-1 overflow-y-auto pb-32">
        {view === 'overview' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <AdminStatCard label="Waitlist" value={props.bookings.filter(b => b.status === 'waiting').length} color="amber" onClick={() => setView('bookings')} />
              <AdminStatCard label="Partners" value={new Set(props.bookings.map(b => b.user_id)).size} color="blue" />
            </div>

            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Order Volume (7D)</h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="orders" stroke="#005696" strokeWidth={3} dot={{ r: 4, fill: '#005696' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid gap-3">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Super Admin Actions</h4>
               <QuickAction icon={<ICONS.History className="w-5 h-5"/>} label="Review Waitlist" onClick={() => setView('bookings')} color="bg-amber-500" />
               <QuickAction icon={<ICONS.Booking className="w-5 h-5"/>} label="Manage Catalog" onClick={() => setView('products')} color="bg-blue-600" />
               <QuickAction icon={<ICONS.Rewards className="w-5 h-5"/>} label="Redemption Requests" onClick={() => setView('withdrawals')} color="bg-emerald-600" />
               <div className="grid grid-cols-2 gap-3 mt-2">
                 <button onClick={() => exportToCSV('bookings')} className="py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">Export Orders</button>
                 <button onClick={() => exportToCSV('partners')} className="py-4 bg-white text-slate-900 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm">Export Partners</button>
               </div>
            </div>
          </div>
        )}

        {view === 'bookings' && (
          <div className="p-4 space-y-4 animate-in fade-in duration-300">
             <div className="flex justify-between items-center px-2">
                <h2 className="text-lg font-black text-slate-900 uppercase">Waitlist Review</h2>
                <span className="text-[10px] font-black text-white bg-amber-500 px-3 py-1 rounded-full uppercase tracking-tighter">New: {props.bookings.filter(b => b.status === 'waiting').length}</span>
             </div>
             {props.bookings.filter(b => b.status === 'waiting').length === 0 ? (
               <div className="py-20 text-center text-slate-400 font-bold italic text-sm">Waitlist clear! 🎉</div>
             ) : (
               props.bookings.filter(b => b.status === 'waiting').map(b => (
                 <div key={b.id} className="bg-white p-5 rounded-[32px] border-2 border-amber-50 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                       <div>
                          <p className="text-xs font-black text-slate-900 uppercase leading-tight">{b.product_name}</p>
                          <p className="text-[10px] font-bold text-[#005696] mt-1">{b.optometrist_name} • Qty: {b.quantity}</p>
                       </div>
                       <span className="text-lg font-black text-emerald-600">+{b.points_earned}</span>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => handleUpdateStatus(b.id, 'approved')} className="flex-1 py-4 bg-[#005696] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100">Approve</button>
                       <button onClick={() => handleUpdateStatus(b.id, 'rejected')} className="px-6 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest">Reject</button>
                    </div>
                 </div>
               ))
             )}
          </div>
        )}

        {view === 'products' && (
          <div className="p-4 space-y-4 animate-in fade-in duration-300">
             <div className="flex justify-between items-center px-2">
                <h2 className="text-lg font-black text-slate-900 uppercase">Catalog</h2>
                <div className="flex gap-2">
                   <input type="file" accept=".csv" ref={fileInputRef} onChange={handleCSVUpload} className="hidden" />
                   <button onClick={() => fileInputRef.current?.click()} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-[9px] font-black uppercase border border-slate-200">Bulk</button>
                   <button onClick={() => setShowProductForm(true)} className="px-4 py-2 bg-[#005696] text-white rounded-xl text-[9px] font-black uppercase shadow-lg shadow-blue-100">+ New</button>
                </div>
             </div>
             <div className="space-y-3">
                {props.products.map(p => (
                   <div key={p.id} className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm flex justify-between items-center">
                      <div>
                         <p className="font-black text-slate-900 text-sm">{p.product_name}</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase">{p.brand}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-lg font-black text-[#005696]">{p.points_per_unit}<span className="text-[9px] opacity-40 ml-1">pts</span></p>
                         <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${p.active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{p.active ? 'ACTIVE' : 'INACTIVE'}</span>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        )}

        {view === 'withdrawals' && (
          <div className="p-4 space-y-4">
             <h2 className="text-lg font-black text-slate-900 px-2 uppercase tracking-tighter">Pending Redemptions</h2>
             {props.withdrawals.filter(w => w.status === 'pending').map(w => (
                <div key={w.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
                   <div className="flex justify-between items-center">
                      <div>
                         <p className="text-xl font-black text-slate-900 tracking-tighter">₹{w.amount}</p>
                         <p className="text-[10px] font-bold text-[#005696]">{w.upi_id}</p>
                      </div>
                      <span className="text-[9px] font-black bg-slate-50 px-3 py-1.5 rounded-full uppercase tracking-widest">{w.points} Pts</span>
                   </div>
                   <button onClick={async () => {
                     await supabase.from('withdrawals').update({ status: 'approved' }).eq('id', w.id);
                     props.setWithdrawals(prev => prev.map(item => item.id === w.id ? { ...item, status: 'approved' } : item));
                   }} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-200">Process Payout</button>
                </div>
             ))}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-xl border-t flex justify-around p-4 pb-6 z-40 shadow-2xl">
        <button onClick={() => setView('overview')} className={`flex flex-col items-center gap-1.5 transition-all ${view === 'overview' ? 'text-[#005696]' : 'text-slate-300'}`}><ICONS.Dashboard className="w-6 h-6"/><span className="text-[9px] font-black uppercase tracking-widest">Home</span></button>
        <button onClick={() => setView('bookings')} className={`flex flex-col items-center gap-1.5 transition-all ${view === 'bookings' ? 'text-amber-500' : 'text-slate-300'}`}><ICONS.History className="w-6 h-6"/><span className="text-[9px] font-black uppercase tracking-widest">Waitlist</span></button>
        <button onClick={() => setView('products')} className={`flex flex-col items-center gap-1.5 transition-all ${view === 'products' ? 'text-[#005696]' : 'text-slate-300'}`}><ICONS.Booking className="w-6 h-6"/><span className="text-[9px] font-black uppercase tracking-widest">Catalog</span></button>
        <button onClick={() => setView('withdrawals')} className={`flex flex-col items-center gap-1.5 transition-all ${view === 'withdrawals' ? 'text-red-500' : 'text-slate-300'}`}><ICONS.Rewards className="w-6 h-6"/><span className="text-[9px] font-black uppercase tracking-widest">Payouts</span></button>
      </nav>

      {showProductForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end justify-center">
           <div className="bg-white w-full rounded-t-[50px] p-10 pb-12 space-y-8 animate-in slide-in-from-bottom duration-500 shadow-2xl">
              <div className="flex justify-between items-center">
                 <h3 className="text-2xl font-black text-slate-900 tracking-tight">Add Product</h3>
                 <button onClick={() => setShowProductForm(false)} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-2xl text-slate-400 hover:text-red-500 transition-colors"><ICONS.X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const target = e.target as any;
                const { data, error } = await supabase.from('products').insert([{ 
                  product_name: target.pname.value,
                  brand: 'CooperVision',
                  points_per_unit: parseInt(target.ppoints.value),
                  active: true
                }]).select();
                if (!error) {
                  props.setProducts(prev => [...prev, data[0]]);
                  setShowProductForm(false);
                }
              }} className="space-y-6">
                 <input name="pname" required placeholder="Product Title (e.g. Biofinity)" className="w-full px-6 py-5 bg-slate-50 rounded-2xl font-bold border-2 border-slate-50 focus:border-[#005696] outline-none" />
                 <input name="ppoints" type="number" required placeholder="Points per Unit" className="w-full px-6 py-5 bg-slate-50 rounded-2xl font-black border-2 border-slate-50 focus:border-[#005696] outline-none" />
                 <button type="submit" className="w-full py-6 bg-[#005696] text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-blue-900/30">Save Product</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

const QuickAction = ({ icon, label, onClick, color }: any) => (
  <button onClick={onClick} className={`flex items-center gap-4 p-5 rounded-[28px] ${color} text-white shadow-xl shadow-slate-200 transition-transform active:scale-95 group`}>
    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">{icon}</div>
    <span className="font-black text-sm uppercase tracking-widest">{label}</span>
  </button>
);

const AdminStatCard = ({ label, value, color, onClick }: any) => {
  const colors: Record<string, string> = {
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100'
  };
  return (
    <button onClick={onClick} className={`p-6 rounded-[32px] border ${colors[color]} text-left space-y-1 shadow-sm active:scale-95 transition-transform`}>
       <p className="text-[9px] font-black uppercase tracking-widest opacity-70 leading-none">{label}</p>
       <p className="text-3xl font-black tracking-tight">{value}</p>
    </button>
  );
};

export default AdminDashboard;
