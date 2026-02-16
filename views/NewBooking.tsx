
import React, { useState } from 'react';
import { User, Product, Booking } from '../types';
import { supabase } from '../lib/supabase';

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
  const calculatedPoints = selectedProduct 
    ? Math.floor(selectedProduct.base_price * (selectedProduct.reward_percentage / 100)) * quantity
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) return alert('Select a product first');
    
    setIsSubmitting(true);
    
    const newBooking: Partial<Booking> = {
      id: `BK-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      user_id: user.id,
      product_id: productId,
      product_name: selectedProduct!.product_name,
      quantity,
      status: 'waiting',
      points_earned: calculatedPoints,
      optometrist_name: user.full_name, // Critical for admin visibility
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
    <div className="p-6">
      <header className="mb-6">
        <h2 className="text-2xl font-black text-slate-900 tracking-tighter">New Order Entry</h2>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Waitlist submission</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-[32px] shadow-sm border space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Select CooperVision Item</label>
            <select 
              required
              className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-800 appearance-none focus:border-[#005696] transition-all"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              <option value="">Choose lens type...</option>
              {products.filter(p => p.active).map(p => (
                <option key={p.id} value={p.id}>{p.product_name} ({p.reward_percentage}% Pts)</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#005696] uppercase tracking-widest text-center block">Quantity Sold</label>
            <div className="flex items-center gap-4 bg-[#005696]/5 p-3 rounded-[28px] border border-[#005696]/10">
              <button 
                type="button" 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-2xl font-black text-[#005696]"
              >–</button>
              
              <div className="flex-1 text-center">
                <span className="block text-5xl font-black text-[#005696] tracking-tighter leading-none">{quantity}</span>
                <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Units</span>
              </div>

              <button 
                type="button" 
                onClick={() => setQuantity(quantity + 1)}
                className="w-16 h-16 bg-[#005696] rounded-2xl shadow-lg shadow-blue-900/20 flex items-center justify-center text-2xl font-black text-white"
              >+</button>
            </div>
          </div>
        </div>

        <div className="bg-emerald-600 p-8 rounded-[40px] text-white shadow-2xl shadow-emerald-900/20 text-center space-y-1">
           <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Reward Allocation</p>
           <h3 className="text-4xl font-black">+{calculatedPoints}</h3>
           <p className="text-[10px] font-bold opacity-70">Points will be added to waitlist</p>
        </div>

        <button 
          type="submit"
          disabled={isSubmitting || !productId}
          className={`w-full py-6 rounded-[24px] font-black text-lg text-white shadow-2xl transition-all active:scale-95 ${isSubmitting || !productId ? 'bg-slate-300 shadow-none' : 'bg-slate-900 shadow-slate-900/20'}`}
        >
          {isSubmitting ? 'Submitting...' : 'SUBMIT WAITLIST'}
        </button>
      </form>
    </div>
  );
};

export default NewBooking;
