
import React, { useState, useRef } from 'react';
import { User, Booking, Product, Withdrawal, BookingStatus, WithdrawalStatus } from '../../types';
import { ICONS } from '../../constants';
import { supabase } from '../../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stats Logic
  const stats = [
    { label: 'Pending Bookings', value: props.bookings.filter(b => b.status === 'waiting').length, color: 'text-amber-600' },
    { label: 'Approved Today', value: props.bookings.filter(b => b.status === 'approved' && new Date(b.created_at).toDateString() === new Date().toDateString()).length, color: 'text-emerald-600' },
    { label: 'Unpaid Rewards', value: props.withdrawals.filter(w => w.status === 'pending').length, color: 'text-red-600' },
    { label: 'Active Partners', value: new Set(props.bookings.map(b => b.user_id)).size, color: 'text-blue-600' }
  ];

  // Booking Approval
  const handleUpdateBookingStatus = async (id: string, status: BookingStatus) => {
    setIsUpdating(id);
    try {
      const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
      if (error) throw error;
      props.setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsUpdating(null);
    }
  };

  // Withdrawal Approval
  const handleUpdateWithdrawalStatus = async (id: string, status: WithdrawalStatus) => {
    setIsUpdating(id);
    try {
      const { error } = await supabase.from('withdrawals').update({ status }).eq('id', id);
      if (error) throw error;
      props.setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status } : w));
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsUpdating(null);
    }
  };

  // CSV Bulk Upload
  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n').slice(1); // Skip header
      const newProducts = rows.map(row => {
        const [name, points] = row.split(',');
        if (!name || !points) return null;
        return {
          product_name: name.trim(),
          points_per_unit: parseInt(points.trim()),
          brand: 'CooperVision',
          active: true
        };
      }).filter(Boolean);

      if (newProducts.length > 0) {
        const { data, error } = await supabase.from('products').insert(newProducts).select();
        if (error) alert("Upload failed: " + error.message);
        else {
          props.setProducts(prev => [...prev, ...data]);
          alert(`Successfully uploaded ${data.length} products!`);
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <aside className="w-64 bg-white border-r flex flex-col p-6 space-y-8">
        <div>
          <h1 className="text-2xl font-black text-[#005696] tracking-tighter">ADMIN<br/><span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Rewards Engine</span></h1>
        </div>
        
        <nav className="flex-1 space-y-1">
          <SidebarLink icon={<ICONS.Dashboard className="w-5 h-5"/>} label="Overview" active={view === 'overview'} onClick={() => setView('overview')} />
          <SidebarLink icon={<ICONS.History className="w-5 h-5"/>} label="Waitlist (Bookings)" active={view === 'bookings'} onClick={() => setView('bookings')} />
          <SidebarLink icon={<ICONS.Booking className="w-5 h-5"/>} label="Product Inventory" active={view === 'products'} onClick={() => setView('products')} />
          <SidebarLink icon={<ICONS.Rewards className="w-5 h-5"/>} label="Redemption Desk" active={view === 'withdrawals'} onClick={() => setView('withdrawals')} />
        </nav>

        <div className="pt-6 border-t">
          <button onClick={props.onLogout} className="w-full py-3 bg-red-50 text-red-600 font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
            <ICONS.X className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-10">
        {view === 'overview' && (
          <div className="space-y-10">
            <div className="grid grid-cols-4 gap-6">
              {stats.map(s => (
                <div key={s.label} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm transition-transform hover:scale-[1.02]">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                  <p className={`text-4xl font-black ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-3 gap-8">
               <div className="col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm h-96">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-blue-500"></div> Performance Analytics
                </h3>
                <ResponsiveContainer width="100%" height="90%">
                  <BarChart data={[{name:'Mon',v:42},{name:'Tue',v:78},{name:'Wed',v:51},{name:'Thu',v:96},{name:'Fri',v:124}]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <Bar dataKey="v" fill="#005696" radius={[6,6,0,0]} barSize={40} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                    <Tooltip cursor={{fill: '#f8fafc'}} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-[#005696] text-white p-8 rounded-3xl shadow-xl shadow-blue-900/20">
                <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
                <div className="space-y-4">
                  <button onClick={() => setView('products')} className="w-full py-4 bg-white/10 rounded-2xl text-sm font-bold border border-white/20 hover:bg-white/20 transition-all text-left px-5">Add New Product</button>
                  <button onClick={() => setView('withdrawals')} className="w-full py-4 bg-white/10 rounded-2xl text-sm font-bold border border-white/20 hover:bg-white/20 transition-all text-left px-5">Review Redemptions</button>
                  <button onClick={() => setView('bookings')} className="w-full py-4 bg-white/10 rounded-2xl text-sm font-bold border border-white/20 hover:bg-white/20 transition-all text-left px-5">Bulk Approve Waitlist</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'bookings' && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Order Waitlist</h3>
              <span className="text-xs font-bold text-slate-400">Total Pending: {props.bookings.filter(b => b.status === 'waiting').length}</span>
            </div>
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Partner Details</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Information</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Qty</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Points</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {props.bookings.length === 0 ? (
                  <tr><td colSpan={5} className="py-20 text-center text-slate-400 italic">No bookings found in waitlist.</td></tr>
                ) : (
                  props.bookings.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <p className="text-sm font-black text-slate-900">{b.optometrist_name || 'Optometrist'}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">ID: {b.id.substr(0,8)}</p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-bold text-[#005696]">{b.product_name}</p>
                        <p className="text-[10px] font-medium text-slate-400">{new Date(b.created_at).toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-5 text-center font-black text-slate-600">{b.quantity}</td>
                      <td className="px-6 py-5 text-right font-black text-emerald-600">+{b.points_earned}</td>
                      <td className="px-6 py-5">
                        <div className="flex justify-center gap-2">
                          {b.status === 'waiting' ? (
                            <>
                              <button 
                                disabled={isUpdating === b.id}
                                onClick={() => handleUpdateBookingStatus(b.id, 'approved')} 
                                className="w-10 h-10 flex items-center justify-center bg-emerald-100 text-emerald-600 rounded-full hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                              ><ICONS.Check className="w-5 h-5"/></button>
                              <button 
                                disabled={isUpdating === b.id}
                                onClick={() => handleUpdateBookingStatus(b.id, 'rejected')} 
                                className="w-10 h-10 flex items-center justify-center bg-red-100 text-red-600 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-sm"
                              ><ICONS.X className="w-5 h-5"/></button>
                            </>
                          ) : (
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${b.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{b.status}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {view === 'products' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-800">Product Inventory</h3>
              <div className="flex gap-4">
                <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleCsvUpload} />
                <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-600 hover:border-[#005696] hover:text-[#005696] transition-all flex items-center gap-2">
                   CSV Bulk Upload
                </button>
                <button onClick={() => setShowProductForm(true)} className="px-6 py-3 bg-[#005696] text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-900/10 hover:bg-blue-800 transition-all">
                   + Add Product
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm">
               <table className="w-full text-left">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Brand</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Name</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Points/Unit</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {props.products.map(p => (
                    <tr key={p.id}>
                      <td className="px-6 py-4 font-bold text-slate-400 text-xs">CooperVision</td>
                      <td className="px-6 py-4 font-bold text-slate-800">{p.product_name}</td>
                      <td className="px-6 py-4 text-right font-black text-[#005696]">{p.points_per_unit}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full uppercase">Active</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'withdrawals' && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Point Redemptions</h3>
            </div>
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Partner</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">UPI ID (Destination)</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Points</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount (INR)</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {props.withdrawals.length === 0 ? (
                  <tr><td colSpan={5} className="py-20 text-center text-slate-400 italic font-medium">No redemption requests yet.</td></tr>
                ) : (
                  props.withdrawals.map(w => (
                    <tr key={w.id}>
                      <td className="px-6 py-5 font-bold text-slate-900">Partner ID: {w.user_id.substr(0,8)}</td>
                      <td className="px-6 py-5 text-sm font-black text-[#005696] underline underline-offset-4">{w.upi_id}</td>
                      <td className="px-6 py-5 text-right font-bold text-slate-500">{w.points.toLocaleString()}</td>
                      <td className="px-6 py-5 text-right font-black text-slate-900">₹{w.amount.toLocaleString()}</td>
                      <td className="px-6 py-5 text-center">
                         {w.status === 'pending' ? (
                            <div className="flex justify-center gap-2">
                               <button 
                                  disabled={isUpdating === w.id}
                                  onClick={() => handleUpdateWithdrawalStatus(w.id, 'approved')}
                                  className="px-4 py-2 bg-blue-600 text-white text-[10px] font-black rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/20"
                               >PAY NOW</button>
                               <button 
                                  disabled={isUpdating === w.id}
                                  onClick={() => handleUpdateWithdrawalStatus(w.id, 'rejected')}
                                  className="px-4 py-2 bg-slate-100 text-slate-600 text-[10px] font-black rounded-xl hover:bg-slate-200 transition-colors"
                               >DECLINE</button>
                            </div>
                         ) : (
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${w.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{w.status}</span>
                         )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Modal for adding product */}
      {showProductForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-[40px] p-10 w-full max-w-md shadow-2xl space-y-8 animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <h3 className="text-2xl font-black text-slate-900">Add New Product</h3>
              <p className="text-sm text-slate-500 mt-1">Populate the CooperVision inventory</p>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              const name = (e.target as any).pname.value;
              const points = (e.target as any).ppoints.value;
              const { data, error } = await supabase.from('products').insert([{ product_name: name, points_per_unit: points, brand: 'CooperVision' }]).select();
              if (error) alert(error.message);
              else {
                props.setProducts([...props.products, data[0]]);
                setShowProductForm(false);
              }
            }} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Title</label>
                <input name="pname" required placeholder="e.g. Biofinity (12 Lenses)" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#005696] outline-none font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Points Value (per unit)</label>
                <input name="ppoints" type="number" required placeholder="e.g. 1000" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#005696] outline-none font-bold" />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowProductForm(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all">Cancel</button>
                <button type="submit" className="flex-2 py-4 bg-[#005696] text-white font-black rounded-2xl hover:bg-blue-800 transition-all px-10">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const SidebarLink = ({ icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-bold transition-all ${active ? 'bg-[#005696] text-white shadow-lg shadow-blue-900/10' : 'text-slate-400 hover:bg-slate-100'}`}>
    {icon} {label}
  </button>
);

export default AdminDashboard;
