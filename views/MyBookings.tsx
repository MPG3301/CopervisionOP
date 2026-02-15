
import React from 'react';
import { Booking } from '../types';

const MyBookings: React.FC<{ bookings: Booking[] }> = ({ bookings }) => {
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-slate-900 mb-6">Booking History</h2>
      
      <div className="space-y-4">
        {bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <p className="font-medium">No history found</p>
          </div>
        ) : (
          bookings.map(booking => (
            <div key={booking.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:border-slate-200 transition-all">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm line-clamp-1">{booking.product_name}</h3>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">ID: {booking.id} • Qty: {booking.quantity}</p>
                </div>
                <StatusBadge status={booking.status} />
              </div>
              
              <div className="flex justify-between items-end mt-4 pt-3 border-t border-slate-50">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Points</span>
                  <span className="text-sm font-black text-[#005696]">{booking.points_earned} pts</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">{new Date(booking.created_at).toLocaleDateString()}</span>
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
    waiting: 'bg-amber-50 text-amber-600',
    approved: 'bg-emerald-50 text-emerald-600',
    rejected: 'bg-red-50 text-red-600'
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${styles[status]}`}>
      {status}
    </span>
  );
};

export default MyBookings;
