
import React, { useState } from 'react';
import { User, Product, Booking } from '../types';
import { supabase } from '../lib/supabase';
import { ICONS } from '../constants';

interface NewBookingProps {
  user: User;
  products: Product[];
  onBookingSubmit: (booking: Booking) => void;
}

const NewBooking: React.FC<NewBookingProps> = ({ user, products, onBookingSubmit }) => {
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedProduct = products.find(p => p.id === productId);
  
  // Ensure we are working with numbers to prevent NaN
  const unitPoints = Number(selectedProduct?.points_per_unit || 0);
  const calculatedPoints = unitPoints * Number(quantity || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) return alert('Please choose a product.');
    
    setIsSubmitting(true);
    
    const newBooking: Partial<Booking> = {
      id: `CV-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      user_id: user.id,
      product_id: productId,
      product_name: selectedProduct!.product_name,
      quantity: Number(quantity),
      status: 'waiting',
      points_earned: calculatedPoints,
      optometrist_name: user.full_name,
      created_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('bookings').insert([newBooking]);
      if (error) throw error;
      onBookingSubmit(newBooking as Booking);
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Order Entry</h2>
        <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mt-1 italic">Submit to Waitlist</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Select Lens Model</label>
            <div className="relative">
              <select 
                required
                className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black text-slate-900 appearance-none focus:border-[#005696] focus:bg-white transition-all outline-none"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
              >
                <option value="">Select Item...</option>
                {products.filter(p => p.active).map(p => (
                  <option key={p.id} value={p.id}>{p.product_name} ({p.points_per_unit} pts/unit)</option>
                ))}
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"/></svg>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-[#005696] uppercase tracking-[0.2em] text-center block">Quantity Dispatched</label>
            <div className="flex items-center gap-4 bg-[#005696]/5 p-4 rounded-[35px] border-2 border-[#005696]/10">
              <button 
                type="button" 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center text-3xl font-black text-[#005696] active:scale-90 transition-transform"
              >–</button>
              
              <div className="flex-1 text-center">
                <span className="block text-6xl font-black text-[#005696] tracking-tighter leading-none">{quantity}</span>
                <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Units Sold</span>
              </div>

              <button 
                type="button" 
                onClick={() => setQuantity(quantity + 1)}
                className="w-20 h-20 bg-[#005696] rounded-3xl shadow-xl shadow-blue-900/30 flex items-center justify-center text-3xl font-black text-white active:scale-90 transition-transform"
              >+</button>
            </div>
          </div>
        </div>

        <div className="bg-[#005696] p-8 rounded-[45px] text-white shadow-2xl shadow-blue-900/30 text-center space-y-1 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <ICONS.Rewards className="w-24 h-24 rotate-12" />
           </div>
           <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Estimated Reward</p>
           <h3 className="text-5xl font-black tracking-tighter">
             +{isNaN(calculatedPoints) ? 0 : calculatedPoints} <span className="text-sm opacity-50 uppercase">pts</span>
           </h3>
           <p className="text-[9px] font-bold opacity-40 mt-2 uppercase tracking-tighter">Credits after admin verification</p>
        </div>

        <button 
          type="submit"
          disabled={isSubmitting || !productId}
          className={`w-full py-7 rounded-[30px] font-black text-xl text-white shadow-2xl transition-all active:scale-95 ${isSubmitting || !productId ? 'bg-slate-300 shadow-none' : 'bg-slate-900 shadow-slate-900/30'}`}
        >
          {isSubmitting ? 'Syncing...' : 'SUBMIT TO WAITLIST'}
        </button>
      </form>
    </div>
  );
};

export default NewBooking;
