
import React, { useState, useMemo } from 'react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [billFile, setBillFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedProduct = useMemo(() => products.find(p => p.id === productId), [products, productId]);
  
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products.filter(p => p.active);
    return products.filter(p => 
      p.active && 
      (p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
       p.brand.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [products, searchTerm]);

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
        <div className="bg-white p-7 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
          <div className="space-y-2 relative">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Select Lens Model</label>
            <div className="relative">
              <input 
                type="text"
                placeholder="Search model (e.g. Biofinity)..."
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold outline-none focus:border-[#005696] focus:bg-white transition-all shadow-sm"
                value={selectedProduct ? selectedProduct.product_name : searchTerm}
                onFocus={() => { setShowDropdown(true); if(selectedProduct) { setProductId(''); setSearchTerm(''); } }}
                onChange={(e) => { setSearchTerm(e.target.value); setProductId(''); setShowDropdown(true); }}
              />
              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto">
                  {filteredProducts.length > 0 ? filteredProducts.map(p => (
                    <button 
                      key={p.id}
                      type="button"
                      className="w-full px-6 py-4 text-left hover:bg-slate-50 border-b border-slate-50 last:border-none flex justify-between items-center group"
                      onClick={() => {
                        setProductId(p.id);
                        setSearchTerm(p.product_name);
                        setShowDropdown(false);
                      }}
                    >
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{p.product_name}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{p.brand}</p>
                      </div>
                      <span className="text-[10px] font-black text-[#005696] opacity-0 group-hover:opacity-100 transition-opacity">SELECT</span>
                    </button>
                  )) : (
                    <div className="p-6 text-center text-xs text-slate-400 font-bold uppercase italic">No matches found</div>
                  )}
                </div>
              )}
            </div>
            {showDropdown && <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowDropdown(false)}></div>}
          </div>

          <div className="space-y-4">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center block">Quantity Dispatched</label>
             <div className="flex items-center justify-between bg-slate-50 p-4 rounded-[30px] border-2 border-slate-50">
                <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 bg-white rounded-xl shadow-md font-black text-2xl text-[#005696] active:scale-90 transition-transform flex items-center justify-center">-</button>
                <div className="flex flex-col items-center">
                  <span className="text-4xl font-black text-[#005696] tracking-tighter">{quantity}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Packs</span>
                </div>
                <button type="button" onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 bg-[#005696] rounded-xl shadow-xl shadow-blue-900/30 font-black text-2xl text-white active:scale-90 transition-transform flex items-center justify-center">+</button>
             </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-50">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Upload Bill Receipt</label>
            <div className="relative group overflow-hidden rounded-2xl">
              <input type="file" accept="image/*,.pdf" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
              <div className={`w-full py-5 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all ${billFile ? 'bg-blue-50 border-[#005696]' : 'bg-slate-50 border-slate-200 group-hover:border-[#005696]'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${billFile ? 'bg-[#005696] text-white' : 'bg-white text-slate-300 shadow-sm'}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                </div>
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest text-center px-4">
                  {billFile ? billFile.name : 'Tap to select slip'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#005696] p-6 rounded-[35px] text-white text-center shadow-2xl shadow-blue-900/20 relative overflow-hidden group">
           <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-60 mb-1">Estimated Reward</p>
           <h3 className="text-4xl font-black tracking-tighter">+{calculatedPoints.toLocaleString()} <span className="text-[10px] opacity-50 uppercase tracking-normal font-bold">pts</span></h3>
        </div>

        <button 
          type="submit" disabled={isSubmitting}
          className={`w-full py-6 rounded-[28px] font-black text-lg text-white shadow-2xl transition-all active:scale-95 ${isSubmitting ? 'bg-slate-300 cursor-not-allowed' : 'bg-slate-900 shadow-slate-900/30'}`}
        >
          {isSubmitting ? 'Processing...' : 'SUBMIT ORDER'}
        </button>
      </form>
    </div>
  );
};

export default NewBooking;
