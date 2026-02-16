
import React, { useState } from 'react';
import { User, Booking, Product, Withdrawal, BookingStatus, WithdrawalStatus } from '../../types';
import { ICONS } from '../../constants';
import { supabase } from '../../lib/supabase';

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
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  
  // Local form state for real-time percentage preview
  const [formPrice, setFormPrice] = useState(2000);
  const [formPct, setFormPct] = useState(5);

  const handleUpdateBookingStatus = async (id: string, status: BookingStatus) => {
    setIsUpdating(id);
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    if (!error) props.setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    setIsUpdating(null);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 max-w-md mx-auto relative overflow-hidden font-sans border-x">
      <header className="bg-white px-6 py-4 border-b flex justify-between items-center sticky top-0 z-20">
        <div>
          <h1 className="text-xl font-black text-slate-900 leading-none">Admin</h1>
          <p className="text-[10px] font-bold text-[#005696] uppercase tracking-tighter">Portal Controller</p>
        </div>
        <button onClick={props.onLogout} className="text-[10px] font-black bg-slate-100 px-3 py-1.5 rounded-lg uppercase tracking-widest text-slate-500">Exit</button>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        {view === 'overview' && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
               <AdminStatCard label="Pending Orders" value={props.bookings.filter(b => b.status === 'waiting').length} color="amber" onClick={() => setView('bookings')} />
               <AdminStatCard label="Payout Tasks" value={props.withdrawals.filter(w => w.status === 'pending').length} color="red" onClick={() => setView('withdrawals')} />
            </div>

            <div className="bg-[#005696] p-8 rounded-[40px] text-white shadow-2xl shadow-blue-900/30">
               <h3 className="text-2xl font-black tracking-tighter">Inventory Control</h3>
               <p className="text-xs opacity-70 mt-1 mb-6">Set points reward (1% - 8%) and stock levels</p>
               <button onClick={() => setView('products')} className="w-full py-4 bg-white text-[#005696] rounded-2xl font-black text-sm uppercase tracking-widest">Update Catalog</button>
            </div>
            
            <div className="bg-white p-6 rounded-[32px] border border-slate-100">
               <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Latest Waitlist Entry</h4>
               {props.bookings.filter(b => b.status === 'waiting').length > 0 ? (
                 <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                    <p className="text-xs font-black text-slate-800">{props.bookings.filter(b => b.status === 'waiting')[0].product_name}</p>
                    <button onClick={() => setView('bookings')} className="text-[9px] font-black text-[#005696] underline">VIEW ALL</button>
                 </div>
               ) : (
                 <p className="text-xs text-slate-400 font-medium italic">Everything is processed! 🎉</p>
               )}
            </div>
          </div>
        )}

        {view === 'bookings' && (
          <div className="p-4 space-y-3">
             <h2 className="text-lg font-black text-slate-900 px-2">Waitlist Reviews</h2>
             {props.bookings.filter(b => b.status === 'waiting').length === 0 ? (
               <div className="text-center py-20 text-slate-400 font-bold italic">No new entries in waitlist.</div>
             ) : (
               props.bookings.filter(b => b.status === 'waiting').map(b => (
                 <div key={b.id} className="bg-white p-5 rounded-[32px] border-2 border-amber-100 shadow-sm animate-pulse-subtle">
                   <div className="flex justify-between items-start mb-3">
                     <div>
                       <p className="text-xs font-black text-slate-900 uppercase">{b.product_name}</p>
                       <p className="text-[10px] font-bold text-[#005696]">{b.optometrist_name}</p>
                     </div>
                     <span className="text-lg font-black text-emerald-600">+{b.points_earned}</span>
                   </div>
                   <div className="flex gap-2 pt-3 border-t">
                      <button onClick={() => handleUpdateBookingStatus(b.id, 'approved')} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest">Approve</button>
                      <button onClick={() => handleUpdateBookingStatus(b.id, 'rejected')} className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest">Reject</button>
                   </div>
                 </div>
               ))
             )}
          </div>
        )}

        {view === 'products' && (
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-lg font-black text-slate-900">Inventory & %</h2>
              <button onClick={() => setShowProductForm(true)} className="px-5 py-2.5 bg-[#005696] text-white rounded-xl font-black text-[10px] uppercase tracking-widest">+ Add</button>
            </div>
            
            {props.products.map(p => (
              <div key={p.id} className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm flex flex-col gap-3">
                <div className="flex justify-between">
                  <p className="font-black text-slate-900 text-sm">{p.product_name}</p>
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase">{p.reward_percentage}% Reward</span>
                </div>
                <div className="flex justify-between items-end bg-slate-50 p-4 rounded-2xl">
                   <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Base Price</p>
                      <p className="text-base font-black text-slate-900">₹{p.base_price}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Points/Unit</p>
                      <p className="text-base font-black text-[#005696]">{Math.floor(p.base_price * p.reward_percentage / 100)}</p>
                   </div>
                </div>
                <div className="flex justify-between items-center px-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Stock: <b>{p.stock_quantity || '0'} units</b></span>
                  <button className="text-[9px] font-black text-slate-300 uppercase tracking-widest hover:text-[#005696]">Edit Item</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {view === 'withdrawals' && (
          <div className="p-4 space-y-4">
             <h2 className="text-lg font-black text-slate-900 px-2">Pending Payouts</h2>
             {props.withdrawals.filter(w => w.status === 'pending').map(w => (
                <div key={w.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
                   <div className="flex justify-between items-center">
                      <div>
                         <p className="text-sm font-black text-slate-900">₹{w.amount}</p>
                         <p className="text-[10px] font-bold text-[#005696]">{w.upi_id}</p>
                      </div>
                      <span className="text-[9px] font-black bg-slate-100 px-3 py-1.5 rounded-full uppercase">{w.points} Pts</span>
                   </div>
                   <button onClick={async () => {
                     await supabase.from('withdrawals').update({ status: 'approved' }).eq('id', w.id);
                     props.setWithdrawals(prev => prev.map(item => item.id === w.id ? { ...item, status: 'approved' } : item));
                   }} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200">MARK AS PAID</button>
                </div>
             ))}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t flex justify-around p-3 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button onClick={() => setView('overview')} className={`flex flex-col items-center gap-1 ${view === 'overview' ? 'text-[#005696]' : 'text-slate-300'}`}><ICONS.Dashboard className="w-6 h-6"/><span className="text-[8px] font-black uppercase">Home</span></button>
        <button onClick={() => setView('bookings')} className={`flex flex-col items-center gap-1 ${view === 'bookings' ? 'text-amber-500' : 'text-slate-300'}`}><ICONS.History className="w-6 h-6"/><span className="text-[8px] font-black uppercase tracking-tighter">Waitlist</span></button>
        <button onClick={() => setView('products')} className={`flex flex-col items-center gap-1 ${view === 'products' ? 'text-[#005696]' : 'text-slate-300'}`}><ICONS.Booking className="w-6 h-6"/><span className="text-[8px] font-black uppercase">Catalog</span></button>
        <button onClick={() => setView('withdrawals')} className={`flex flex-col items-center gap-1 ${view === 'withdrawals' ? 'text-red-500' : 'text-slate-300'}`}><ICONS.Rewards className="w-6 h-6"/><span className="text-[8px] font-black uppercase">Payouts</span></button>
      </nav>

      {showProductForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end justify-center">
           <div className="bg-white w-full rounded-t-[40px] p-8 pb-12 space-y-6 animate-slide-up shadow-2xl">
              <div className="flex justify-between items-center">
                 <h3 className="text-xl font-black text-slate-900">Add Product</h3>
                 <button onClick={() => setShowProductForm(false)} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500"><ICONS.X className="w-4 h-4" /></button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                const target = e.target as any;
                const points = Math.floor(formPrice * formPct / 100);
                const { data, error } = await supabase.from('products').insert([{ 
                  product_name: target.pname.value,
                  base_price: formPrice,
                  reward_percentage: formPct,
                  points_per_unit: points,
                  stock_quantity: parseInt(target.pstock.value),
                  brand: 'CooperVision',
                  active: true
                }]).select();
                if (!error) {
                  props.setProducts(prev => [...prev, data[0]]);
                  setShowProductForm(false);
                }
              }} className="space-y-6">
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Product Title</label>
                    <input name="pname" required placeholder="e.g. MyDay (30 Lenses)" className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold" />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Base Price (₹)</label>
                       <input type="number" required value={formPrice} onChange={e => setFormPrice(parseInt(e.target.value))} className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-black" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Initial Stock</label>
                       <input name="pstock" type="number" defaultValue="100" className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-black" />
                    </div>
                 </div>

                 <div className="space-y-2 p-5 bg-[#005696]/5 rounded-3xl border-2 border-dashed border-[#005696]/20">
                    <div className="flex justify-between items-center px-1 mb-2">
                       <label className="text-[10px] font-black text-[#005696] uppercase tracking-widest">Reward Setting</label>
                       <span className="text-lg font-black text-[#005696]">{formPct}%</span>
                    </div>
                    {/* PERCENTAGE BAR SLIDER */}
                    <input 
                      type="range" min="1" max="8" step="1" 
                      value={formPct} onChange={e => setFormPct(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#005696]"
                    />
                    <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase mt-1">
                       <span>1% Basic</span>
                       <span>8% Premium</span>
                    </div>
                    <div className="mt-4 text-center">
                       <p className="text-[10px] font-bold text-slate-500">Points earned per unit sold:</p>
                       <p className="text-2xl font-black text-[#005696]">{Math.floor(formPrice * formPct / 100)} pts</p>
                    </div>
                 </div>

                 <button type="submit" className="w-full py-5 bg-[#005696] text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-900/20">Create Product</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

const AdminStatCard = ({ label, value, color, onClick }: any) => {
  const colors: Record<string, string> = {
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100'
  };
  return (
    <button onClick={onClick} className={`p-5 rounded-[32px] border ${colors[color]} text-left space-y-1 shadow-sm transition-transform active:scale-95`}>
       <p className="text-[9px] font-black uppercase tracking-widest opacity-70">{label}</p>
       <p className="text-3xl font-black">{value}</p>
    </button>
  );
};

export default AdminDashboard;
