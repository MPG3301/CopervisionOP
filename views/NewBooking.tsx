
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
  const [billFile, setBillFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedProduct = products.find(p => p.id === productId);
  const calculatedPoints = (Number(selectedProduct?.points_per_unit) || 0) * quantity;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size > 2 * 1024 * 1024) {
      alert("Error: File exceeds 2MB limit. Please upload a smaller image or PDF.");
      e.target.value = '';
      return;
    }
    setBillFile(file || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) return alert('Select a lens model');
    setIsSubmitting(true);

    let billUrl = '';
    try {
      if (billFile) {
        const fileExt = billFile.name.split('.').pop();
        const fileName = `${user.id}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('bills').upload(fileName, billFile);
        
        if (uploadError) throw uploadError;
        
        const { data: publicUrl } = supabase.storage.from('bills').getPublicUrl(fileName);
        billUrl = publicUrl.publicUrl;
      }

      // Match keys exactly with public.bookings table
      const bookingData = {
        id: `CV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        user_id: user.id,
        product_id: productId,
        product_name: selectedProduct!.product_name,
        optometrist_name: user.full_name,
        quantity: quantity,
        points_earned: calculatedPoints,
        bill_image_url: billUrl,
        status: 'waiting'
      };

      const { error: insertError } = await supabase.from('bookings').insert([bookingData]);
      if (insertError) throw insertError;
      
      onBookingSubmit(bookingData as any as Booking);
    } catch (err: any) {
      alert("Error submitting: " + (err.message || "Unknown Database Error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <header>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Order Entry</h2>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1 italic">Submit sale for reward verification</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-7 rounded-[40px] border border-slate-100 shadow-sm space-y-7">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Select Lens Model</label>
            <select 
              required className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black appearance-none outline-none focus:border-[#005696] focus:bg-white transition-all shadow-sm"
              value={productId} onChange={(e) => setProductId(e.target.value)}
            >
              <option value="">Choose item...</option>
              {products.filter(p => p.active).map(p => (
                <option key={p.id} value={p.id}>{p.product_name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center block">Quantity Dispatched</label>
             <div className="flex items-center justify-between bg-slate-50 p-4 rounded-[30px] border-2 border-slate-50">
                <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-14 h-14 bg-white rounded-2xl shadow-md font-black text-2xl text-[#005696] active:scale-90 transition-transform flex items-center justify-center">-</button>
                <div className="flex flex-col items-center">
                  <span className="text-5xl font-black text-[#005696] tracking-tighter">{quantity}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Packs</span>
                </div>
                <button type="button" onClick={() => setQuantity(quantity + 1)} className="w-14 h-14 bg-[#005696] rounded-2xl shadow-xl shadow-blue-900/30 font-black text-2xl text-white active:scale-90 transition-transform flex items-center justify-center">+</button>
             </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-50 mt-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Upload Bill Receipt (Max 2MB)</label>
            <div className="relative group overflow-hidden rounded-2xl">
              <input type="file" accept="image/*,.pdf" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
              <div className={`w-full py-10 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all ${billFile ? 'bg-blue-50 border-[#005696]' : 'bg-slate-50 border-slate-200 group-hover:border-[#005696]'}`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${billFile ? 'bg-[#005696] text-white' : 'bg-white text-slate-300 shadow-sm'}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                </div>
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest text-center px-4 leading-relaxed">
                  {billFile ? billFile.name : 'Click to select slip or invoice'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#005696] p-7 rounded-[40px] text-white text-center shadow-2xl shadow-blue-900/20 relative overflow-hidden group">
           <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-1">Estimated Reward</p>
           <h3 className="text-5xl font-black tracking-tighter">+{calculatedPoints.toLocaleString()} <span className="text-sm opacity-50 uppercase tracking-normal">pts</span></h3>
        </div>

        <button 
          type="submit" disabled={isSubmitting}
          className={`w-full py-7 rounded-[30px] font-black text-xl text-white shadow-2xl transition-all active:scale-95 ${isSubmitting ? 'bg-slate-300 cursor-not-allowed' : 'bg-slate-900 shadow-slate-900/30'}`}
        >
          {isSubmitting ? 'Submitting Order...' : 'SUBMIT TO WAITLIST'}
        </button>
      </form>
    </div>
  );
};

export default NewBooking;
