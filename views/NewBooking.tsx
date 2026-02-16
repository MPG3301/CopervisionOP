
import React, { useState } from 'react';
import { User, Product, Booking } from '../types';
import { supabase } from '../lib/supabase';
import { notificationService } from '../services/notificationService';

interface NewBookingProps {
  user: User;
  products: Product[];
  onBookingSubmit: (booking: Booking) => void;
}

const NewBooking: React.FC<NewBookingProps> = ({ user, products, onBookingSubmit }) => {
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [image, setImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) return alert('Please select a product first');
    
    setIsSubmitting(true);
    
    const selectedProduct = products.find(p => p.id === productId)!;
    
    const newBooking: Partial<Booking> = {
      id: `BK-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      user_id: user.id,
      product_id: productId,
      product_name: selectedProduct.product_name,
      quantity,
      status: 'waiting',
      points_earned: selectedProduct.points_per_unit * quantity,
      optometrist_name: user.full_name
    };

    try {
      const { error } = await supabase.from('bookings').insert([newBooking]);
      if (error) throw error;

      // Optional: notificationService
      // await notificationService.sendBookingEmail(newBooking as Booking, user);

      onBookingSubmit(newBooking as Booking);
      setIsSubmitting(false);
    } catch (error: any) {
      console.error('Submission failed', error);
      setIsSubmitting(false);
      alert('Error: ' + error.message);
    }
  };

  return (
    <div className="p-6">
      <header className="mb-8">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create Order</h2>
        <p className="text-slate-400 text-sm font-medium">Add products to your waitlist for points</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-6 bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">1. Product Selection</label>
            <select 
              required
              className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-[#005696] focus:bg-white transition-all font-bold text-slate-800 appearance-none"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              <option value="">Select CooperVision Product...</option>
              {products.filter(p => p.active).map(p => (
                <option key={p.id} value={p.id}>{p.product_name} — {p.points_per_unit} pts/unit</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#005696] uppercase tracking-widest ml-1">2. Quantity ordered</label>
            <div className="flex items-center gap-4 bg-[#005696]/5 p-3 rounded-[24px] border border-[#005696]/10">
              <button 
                type="button" 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-16 h-16 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-slate-100 text-3xl font-black text-[#005696] active:scale-90 transition-transform"
              >–</button>
              
              <div className="flex-1 text-center py-2">
                <span className="block text-5xl font-black text-[#005696] tracking-tighter">{quantity}</span>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Units Selected</span>
              </div>

              <button 
                type="button" 
                onClick={() => setQuantity(quantity + 1)}
                className="w-16 h-16 flex items-center justify-center bg-[#005696] rounded-2xl shadow-lg shadow-blue-900/20 text-3xl font-black text-white active:scale-90 transition-transform"
              >+</button>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
           <div className="flex justify-between items-center px-2">
             <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estimated Earn</span>
                <span className="text-2xl font-black text-emerald-600">+{productId ? (products.find(p => p.id === productId)?.points_per_unit || 0) * quantity : 0} pts</span>
             </div>
             <div className="text-right">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Value Approx.</span>
                <span className="text-lg font-bold text-slate-900 block">₹{productId ? ((products.find(p => p.id === productId)?.points_per_unit || 0) * quantity / 10).toFixed(0) : 0}</span>
             </div>
           </div>
        </div>

        <div className="pt-4 px-2">
          <button 
            type="submit"
            disabled={isSubmitting || !productId}
            className={`w-full py-6 rounded-[24px] font-black text-xl text-white shadow-2xl shadow-blue-900/30 transition-all active:scale-[0.97] flex items-center justify-center gap-3 ${isSubmitting || !productId ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-[#005696] hover:bg-blue-800'}`}
          >
            {isSubmitting ? (
              <div className="animate-spin h-6 w-6 border-4 border-white/30 border-t-white rounded-full"></div>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
                SUBMIT TO WAITLIST
              </>
            )}
          </button>
          <p className="text-center text-[10px] text-slate-400 mt-6 px-6 font-bold uppercase tracking-widest leading-relaxed">
            Order will appear in your waitlist immediately. Points credit after admin verification.
          </p>
        </div>
      </form>
    </div>
  );
};

export default NewBooking;
