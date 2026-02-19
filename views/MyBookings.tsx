
import React, { useRef } from 'react';
import { Booking } from '../types';
import { supabase } from '../lib/supabase';

const MyBookings: React.FC<{ bookings: Booking[], onUpdate: () => void }> = ({ bookings, onUpdate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeBookingId = useRef<string | null>(null);

  const handleBillUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeBookingId.current) return;
    if (file.size > 2 * 1024 * 1024) return alert("File too large");

    const fileName = `reupload_${activeBookingId.current}_${Date.now()}`;
    const { data } = await supabase.storage.from('bills').upload(fileName, file);
    if (data) {
      const { data: pub } = supabase.storage.from('bills').getPublicUrl(fileName);
      await supabase.from('bookings').update({ bill_image_url: pub.publicUrl }).eq('id', activeBookingId.current);
      onUpdate();
      alert("Bill updated successfully");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-slate-900 mb-6 tracking-tight">Order Waitlist</h2>
      <input type="file" ref={fileInputRef} onChange={handleBillUpload} className="hidden" accept="image/*,.pdf" />
      
      <div className="space-y-4">
        {bookings.map(booking => (
          <div key={booking.id} className="bg-white rounded-[28px] p-5 shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="font-black text-slate-800 text-sm">{booking.product_name}</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">QTY: {booking.quantity}</p>
              </div>
              <StatusBadge status={booking.status} />
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t border-slate-50">
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Points</span>
                <span className="text-lg font-black text-[#005696]">+{booking.points_earned}</span>
              </div>
              <div className="flex flex-col items-end gap-2">
                {booking.bill_image_url ? (
                  <a href={booking.bill_image_url} target="_blank" className="text-[9px] font-black text-[#005696] border border-[#005696] px-3 py-1 rounded-lg uppercase tracking-widest">View Bill</a>
                ) : (
                  <button onClick={() => { activeBookingId.current = booking.id; fileInputRef.current?.click(); }} className="text-[9px] font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-lg uppercase tracking-widest">Add Bill</button>
                )}
                <span className="text-[9px] text-slate-300 font-bold uppercase">{new Date(booking.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
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
    <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${styles[status]}`}>
      {status === 'waiting' ? 'QUEUED' : status}
    </span>
  );
};

export default MyBookings;
