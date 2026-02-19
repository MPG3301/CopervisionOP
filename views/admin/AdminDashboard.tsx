
import React, { useState, useMemo, useRef } from 'react';
import { User, Booking, Product, Withdrawal, BookingStatus, WithdrawalStatus } from '../../types';
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
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateBooking = async (id: string, status: BookingStatus) => {
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    if (!error) {
      props.setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    }
  };

  const handleUpdateWithdrawal = async (id: string, status: WithdrawalStatus) => {
    const { error } = await supabase.from('withdrawals').update({ status }).eq('id', id);
    if (!error) {
      props.setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status } : w));
    }
  };

  const handleToggleProduct = async (product: Product) => {
    const newStatus = !product.active;
    const { error } = await supabase.from('products').update({ active: newStatus }).eq('id', product.id);
    if (!error) {
      props.setProducts(prev => prev.map(p => p.id === product.id ? { ...p, active: newStatus } : p));
    }
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsBulkUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const productsToInsert = [];
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',');
        if (row.length >= 4) {
          productsToInsert.push({
            product_name: row[0].trim(),
            brand: row[1].trim(),
            points_per_unit: parseInt(row[2].trim()),
            base_price: parseInt(row[3].trim()),
            active: true
          });
        }
      }
      if (productsToInsert.length > 0) {
        const { data, error } = await supabase.from('products').insert(productsToInsert).select();
        if (!error && data) {
          props.setProducts(prev => [...prev, ...data]);
          alert(`Imported ${data.length} products!`);
        }
      }
      setIsBulkUploading(false);
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex h-screen bg-slate-50 w-full overflow-hidden flex-col lg:flex-row">
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

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="bg-white px-6 py-5 border-b flex justify-between items-center z-30 shadow-sm lg:hidden shrink-0">
           <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#005696] rounded-xl flex items-center justify-center text-white font-black text-xs">CV</div>
              <div className="flex flex-col">
                <h1 className="font-black uppercase text-xs tracking-tighter text-[#005696]">Admin Portal</h1>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">{view}</span>
              </div>
           </div>
           <button onClick={props.onLogout} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:text-red-500 transition-colors">
             <ICONS.X className="w-5 h-5" />
           </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-12 pb-28 lg:pb-12">
          {view === 'overview' && (
            <div className="max-w-6xl mx-auto space-y-8">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Master Overview</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatBox label="Waiting" val={props.bookings.filter(b => b.status === 'waiting').length} color="amber" />
                <StatBox label="Partners" val={new Set(props.bookings.map(b => b.user_id)).size} color="blue" />
                <StatBox label="Points" val={props.bookings.filter(b => b.status === 'approved').reduce((s, b) => s + b.points_earned, 0)} color="emerald" />
                <StatBox label="Redemptions" val={props.withdrawals.filter(w => w.status === 'pending').length} color="rose" />
              </div>
            </div>
          )}

          {view === 'bookings' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Waitlist Review</h2>
              <div className="space-y-4">
                {props.bookings.filter(b => b.status === 'waiting').map(b => (
                  <div key={b.id} className="bg-white p-5 rounded-[30px] border border-slate-100 shadow-sm flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-black text-slate-900 text-base uppercase">{b.product_name}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">BY: {b.optometrist_name}</p>
                      </div>
                      <div className="bg-blue-50 px-3 py-1 rounded-full text-[#005696] font-black text-[10px]">{b.quantity} Packs</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdateBooking(b.id, 'approved')} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg">Confirm</button>
                      <button onClick={() => handleUpdateBooking(b.id, 'rejected')} className="flex-1 py-3 bg-slate-100 text-slate-400 rounded-xl text-[10px] font-black uppercase">Deny</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'products' && (
            <div className="max-w-5xl mx-auto space-y-8">
              <header className="flex justify-between items-center">
                 <h2 className="text-2xl font-black text-slate-900 uppercase">Lens Catalog</h2>
                 <div className="flex gap-2">
                    <input type="file" ref={csvInputRef} onChange={handleBulkUpload} className="hidden" accept=".csv" />
                    <button onClick={() => csvInputRef.current?.click()} className="px-6 py-3 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase">CSV Import</button>
                    <button onClick={() => setEditingProduct({} as any)} className="p-3 bg-[#005696] text-white rounded-xl shadow-lg"><ICONS.Booking className="w-5 h-5"/></button>
                 </div>
              </header>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {props.products.map(p => (
                  <div key={p.id} className={`bg-white p-6 rounded-[35px] border border-slate-100 shadow-sm flex flex-col justify-between group transition-all ${!p.active ? 'opacity-50' : ''}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[8px] font-black text-[#005696] uppercase tracking-[0.2em]">{p.brand}</p>
                        <h4 className="text-sm font-black text-slate-900 mt-1">{p.product_name}</h4>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${p.active ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-slate-300'}`}></div>
                    </div>
                    <div className="flex items-center justify-between bg-slate-50/50 p-3 rounded-2xl mb-4">
                       <div className="flex flex-col"><span className="text-[8px] font-black text-slate-400 uppercase">Points</span><span className="text-xs font-black text-slate-700">{p.points_per_unit}</span></div>
                       <div className="flex flex-col text-right"><span className="text-[8px] font-black text-slate-400 uppercase">Price</span><span className="text-xs font-black text-slate-700">₹{p.base_price}</span></div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingProduct(p)} className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase">Edit</button>
                      <button onClick={() => handleToggleProduct(p)} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase text-white ${p.active ? 'bg-amber-500' : 'bg-emerald-500'}`}>{p.active ? 'Off' : 'On'}</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'withdrawals' && (
             <div className="max-w-4xl mx-auto space-y-6 pb-24">
                <header>
                   <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Redemptions</h2>
                   <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1 italic">Process UPI Payouts</p>
                </header>
                <div className="space-y-4">
                   {props.withdrawals.length === 0 ? (
                      <div className="py-24 text-center text-slate-300 font-black italic text-xs border-2 border-dashed border-slate-100 rounded-[30px]">No payout requests</div>
                   ) : (
                      props.withdrawals.map(w => (
                         <div key={w.id} className="bg-white p-6 rounded-[35px] border border-slate-100 shadow-sm flex flex-col gap-5">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                               <div className="flex items-center gap-4">
                                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-[#005696]"><ICONS.Rewards className="w-7 h-7" /></div>
                                  <div>
                                     <p className="text-2xl font-black text-slate-900 leading-none">₹{w.amount.toLocaleString()}</p>
                                     <p className="text-[10px] font-black text-[#005696] uppercase tracking-widest mt-2 bg-blue-50 px-2 py-0.5 rounded-md inline-block">UPI: {w.upi_id}</p>
                                  </div>
                               </div>
                               <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border ${w.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{w.status === 'approved' ? 'PAID' : 'PENDING'}</span>
                            </div>

                            {/* PARTNER DETAILS SECTION */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-50">
                               <DetailItem label="Partner Name" val={w.profiles?.full_name || 'N/A'} />
                               <DetailItem label="Mobile" val={w.profiles?.phone || 'N/A'} />
                               <DetailItem label="Clinic" val={w.profiles?.shop_name || 'N/A'} />
                               <DetailItem label="City" val={w.profiles?.city || 'N/A'} />
                            </div>

                            {w.status === 'pending' && (
                               <div className="flex gap-2 pt-2 border-t border-slate-50">
                                  <button 
                                    onClick={() => handleUpdateWithdrawal(w.id, 'approved')}
                                    className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/30 active:scale-95 transition-all"
                                  >
                                    Confirm Payment & Close
                                  </button>
                                  <button 
                                    onClick={() => handleUpdateWithdrawal(w.id, 'rejected')}
                                    className="px-8 py-4 bg-slate-50 text-slate-300 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:text-red-400 transition-colors"
                                  >
                                    Reject
                                  </button>
                               </div>
                            )}
                         </div>
                      ))
                   )}
                </div>
             </div>
          )}
        </main>

        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t flex justify-around p-3 pb-8 z-50 lg:hidden shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
           <AdminNavItem active={view === 'overview'} label="Hub" icon={<ICONS.Dashboard className="w-6 h-6" />} onClick={() => setView('overview')} />
           <AdminNavItem active={view === 'bookings'} label="Waitlist" icon={<ICONS.History className="w-6 h-6" />} onClick={() => setView('bookings')} />
           <AdminNavItem active={view === 'products'} label="Catalog" icon={<ICONS.Booking className="w-6 h-6" />} onClick={() => setView('products')} />
           <AdminNavItem active={view === 'withdrawals'} label="Payouts" icon={<ICONS.Rewards className="w-6 h-6" />} onClick={() => setView('withdrawals')} />
        </nav>
      </div>
    </div>
  );
};

const DetailItem = ({ label, val }: any) => (
  <div className="flex flex-col">
    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">{label}</span>
    <span className="text-[10px] font-black text-slate-600 truncate">{val}</span>
  </div>
);

const SidebarItem = ({ active, label, icon, onClick }: any) => (
  <button onClick={onClick} className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-black text-sm uppercase tracking-widest ${active ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white'}`}>
    {icon} <span>{label}</span>
  </button>
);

const AdminNavItem = ({ active, label, icon, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1.5 transition-all ${active ? 'text-[#005696] scale-110' : 'text-slate-300'}`}>
    <div className={`${active ? 'bg-[#005696]/5 p-2 rounded-xl text-[#005696]' : ''}`}>{icon}</div>
    <span className={`text-[8px] font-black uppercase text-center ${active ? 'text-[#005696]' : 'text-slate-300'}`}>{label}</span>
  </button>
);

const StatBox = ({ label, val, color }: any) => {
  const c: Record<string, string> = { amber: 'bg-amber-50 text-amber-600', blue: 'bg-blue-50 text-blue-600', emerald: 'bg-emerald-50 text-emerald-600', rose: 'bg-rose-50 text-rose-600' };
  return (
    <div className={`p-5 rounded-[30px] border border-slate-100 ${c[color]} flex flex-col items-start shadow-sm`}>
      <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">{label}</p>
      <p className="text-2xl font-black tracking-tighter">{val.toLocaleString()}</p>
    </div>
  );
};

export default AdminDashboard;
