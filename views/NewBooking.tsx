
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
      alert("File size exceeds 2MB limit.");
      e.target.value = '';
      return;
    }
    setBillFile(file || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) return alert('Select a product');
    setIsSubmitting(true);

    let billUrl = '';
    if (billFile) {
      const fileName = `${user.id}_${Date.now()}_${billFile.name}`;
      const { data, error } = await supabase.storage.from('bills').upload(fileName, billFile);
      if (data) {
        const { data: publicUrl } = supabase.storage.from('bills').getPublicUrl(fileName);
        billUrl = publicUrl.publicUrl;
      }
    }

    const booking: Partial<Booking> = {
      id: `CV-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      user_id: user.id,
      product_id: productId,
      product_name: selectedProduct!.product_name,
      quantity,
      status: 'waiting',
      points_earned: calculatedPoints,
      bill_image_url: billUrl,
      optometrist_name: user.full_name,
      created_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('bookings').insert([booking]);
      if (error) throw error;
      onBookingSubmit(booking as Booking);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <header>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Dispatch Entry</h2>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Submit sale for reward verification</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 space-y-6 shadow-sm">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Product Model</label>
            <select 
              required className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold appearance-none outline-none focus:border-[#005696] transition-all"
              value={productId} onChange={(e) => setProductId(e.target.value)}
            >
              <option value="">Choose item...</option>
              {products.filter(p => p.active).map(p => (
                <option key={p.id} value={p.id}>{p.product_name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center block">Quantity Sold</label>
             <div className="flex items-center justify-between bg-slate-50 p-3 rounded-[24px]">
                <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 bg-white rounded-xl shadow-sm font-black text-xl text-[#005696]">-</button>
                <span className="text-4xl font-black text-[#005696]">{quantity}</span>
                <button type="button" onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 bg-[#005696] rounded-xl shadow-lg font-black text-xl text-white">+</button>
             </div>
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Upload Bill Slip (Optional)</label>
            <div className="relative group cursor-pointer">
              <input type="file" accept="image/*,.pdf" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
              <div className="w-full py-6 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center bg-slate-50/50 group-hover:border-[#005696] transition-all">
                <svg className="w-6 h-6 text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <span className="text-[10px] font-black text-slate-400 uppercase">{billFile ? billFile.name : 'Click to select slip'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#005696] p-6 rounded-[32px] text-white text-center shadow-xl shadow-blue-900/20">
           <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">Reward Payout</p>
           <h3 className="text-4xl font-black">+{calculatedPoints} <span className="text-sm opacity-50 uppercase">pts</span></h3>
        </div>

        <button 
          type="submit" disabled={isSubmitting}
          className={`w-full py-6 rounded-3xl font-black text-lg text-white shadow-2xl transition-all active:scale-95 ${isSubmitting ? 'bg-slate-300' : 'bg-slate-900 shadow-slate-900/30'}`}
        >
          {isSubmitting ? 'Syncing...' : 'SUBMIT TO WAITLIST'}
        </button>
      </form>
    </div>
  );
};

export default NewBooking;
