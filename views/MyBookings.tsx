
import React, { useRef, useState } from 'react';
import { Booking } from '../types';
import { supabase } from '../lib/supabase';
import { ICONS } from '../constants';

const MyBookings: React.FC<{ bookings: Booking[], onUpdate: () => void }> = ({ bookings, onUpdate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeBookingId = useRef<string | null>(null);
  const [isUploading, setIsUploading] = useState<string | null>(null);

  const handleBillUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeBookingId.current) return;
    if (file.size > 2 * 1024 * 1024) return alert("Error: File exceeds 2MB limit");

    setIsUploading(activeBookingId.current);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `reuploads/${activeBookingId.current}_${Date.now()}.${fileExt}`;
      const { data, error: uploadError } = await supabase.storage.from('bills').upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      const { data: pub } = supabase.storage.from('bills').getPublicUrl(fileName);
      const { error: updateError } = await supabase.from('bookings').update({ bill_image_url: pub.publicUrl }).eq('id', activeBookingId.current);
      
      if (updateError) throw updateError;
      
      onUpdate();
      alert("Bill slip successfully updated!");
    } catch (err: any) {
      alert("Update failed: " + err.message);
    } finally {
      setIsUploading(null);
    }
  };

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Order Waitlist</h2>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Track rewards verification</p>
      </header>

      <input type="file" ref={fileInputRef} onChange={handleBillUpload} className="hidden" accept="image/*,.pdf" />
      
      <div className="space-y-5">
        {bookings.length === 0 ? (
          <div className="py-24 text-center text-slate-300 font-black italic text-xs uppercase tracking-widest border-2 border-dashed border-slate-100 rounded-[35px]">No active waitlist items</div>
        ) : (
          bookings.map(booking => (
            <div key={booking.id} className="bg-white rounded-[35px] p-6 shadow-sm border border-slate-100 flex flex-col gap-5 hover:shadow-md transition-shadow group">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-black text-slate-900 text-lg leading-tight uppercase group-hover:text-[#005696] transition-colors">{booking.product_name}</h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">ID: {booking.id}</p>
                </div>
                <StatusBadge status={booking.status} />
              </div>

              <div className="bg-slate-50/50 p-4 rounded-2xl flex justify-between items-center">
                 <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Dispatched</span>
                    <span className="text-xl font-black text-slate-900">{booking.quantity} <span className="text-[10px] opacity-40">units</span></span>
                 </div>
                 <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Reward</span>
                    <span className="text-xl font-black text-[#005696]">+{booking.points_earned.toLocaleString()}</span>
                 </div>
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <div className="flex flex-col">
                   <span className="text-[8px] text-slate-300 font-black uppercase tracking-widest">Date</span>
                   <span className="text-[10px] font-bold text-slate-500">{new Date(booking.created_at).toLocaleDateString()}</span>
                </div>
                
                <div className="flex gap-2">
                  {booking.bill_image_url ? (
                    <a href={booking.bill_image_url} target="_blank" className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-[#005696] rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm border border-blue-100">
                      View Slip
                    </a>
                  ) : (
                    <button 
                      onClick={() => { activeBookingId.current = booking.id; fileInputRef.current?.click(); }}
                      disabled={isUploading === booking.id}
                      className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-amber-100 animate-pulse"
                    >
                      {isUploading === booking.id ? 'Saving...' : 'Missing Slip!'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    waiting: 'bg-amber-50 text-amber-600 border-amber-100',
    approved: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rejected: 'bg-red-50 text-red-600 border-red-100'
  };
  return (
    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm ${styles[status]}`}>
      {status === 'waiting' ? 'PENDING' : status}
    </span>
  );
};

export default MyBookings;
