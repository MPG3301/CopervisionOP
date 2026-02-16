
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

      await notificationService.sendBookingEmail(newBooking as Booking, user);
      await notificationService.sendWhatsAppAlert(newBooking as Booking, user);

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
      <h2 className="text-xl font-bold text-slate-900 mb-6">New Order</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Brand</label>
            <input 
              type="text" 
              disabled 
              value="CooperVision" 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-400" 
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#005696] uppercase tracking-widest">Select Product</label>
            <select 
              required
              className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-xl outline-none focus:border-[#005696] font-medium text-slate-800"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              <option value="">Choose a product...</option>
              {products.filter(p => p.active).map(p => (
                <option key={p.id} value={p.id}>{p.product_name} ({p.points_per_unit} pts)</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Order Quantity</label>
            <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
              <button 
                type="button" 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-14 h-14 flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-100 text-2xl font-black text-slate-800 active:scale-95 transition-transform"
              >–</button>
              <div className="flex-1 text-center">
                <span className="block text-3xl font-black text-[#005696]">{quantity}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Units</span>
              </div>
              <button 
                type="button" 
                onClick={() => setQuantity(quantity + 1)}
                className="w-14 h-14 flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-100 text-2xl font-black text-slate-800 active:scale-95 transition-transform"
              >+</button>
            </div>
          </div>
        </div>

        <div className="space-y-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Proof of Purchase (Optional)</label>
            <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
              <input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                onChange={(e) => setImage(e.target.files?.[0] || null)}
              />
              {image ? (
                <div className="text-center">
                   <p className="text-sm font-bold text-emerald-600">{image.name}</p>
                   <p className="text-[10px] text-slate-400 mt-1">Click to change</p>
                </div>
              ) : (
                <>
                  <svg className="w-10 h-10 text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Capture Bill</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="p-2">
          <button 
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-5 rounded-2xl font-black text-lg text-white shadow-xl shadow-blue-900/20 transition-all active:scale-[0.98] ${isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#005696] hover:bg-blue-800'}`}
          >
            {isSubmitting ? 'Submitting Order...' : 'Submit to Waitlist'}
          </button>
          <p className="text-center text-[10px] text-slate-400 mt-4 px-4 font-medium uppercase tracking-widest">
            Points will be credited after admin approval
          </p>
        </div>
      </form>
    </div>
  );
};

export default NewBooking;
