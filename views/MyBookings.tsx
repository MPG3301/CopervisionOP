
import React from 'react';
import { Booking } from '../types';

const MyBookings: React.FC<{ bookings: Booking[] }> = ({ bookings }) => {
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-slate-900 mb-6 tracking-tight">Booking History</h2>
      
      <div className="space-y-4">
        {bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[32px] border border-slate-100 shadow-sm text-slate-400">
            <svg className="w-16 h-16 mb-4 opacity-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <p className="font-bold text-sm">No waitlisted orders</p>
            <p className="text-[10px] uppercase tracking-widest mt-1">Start by adding a new order</p>
          </div>
        ) : (
          bookings.map(booking => (
            <div key={booking.id} className="bg-white rounded-[28px] p-5 shadow-sm border border-slate-100 hover:border-slate-200 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="font-black text-slate-800 text-sm group-hover:text-[#005696] transition-colors">{booking.product_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md uppercase tracking-tighter">ID: {booking.id.substr(0,8)}</span>
                    <span className="text-[9px] font-black bg-[#005696]/5 text-[#005696] px-2 py-0.5 rounded-md uppercase tracking-tighter">QTY: {booking.quantity}</span>
                  </div>
                </div>
                <StatusBadge status={booking.status} />
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Reward Points</span>
                  <span className="text-lg font-black text-[#005696]">+{booking.points_earned.toLocaleString()}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold block">{new Date(booking.created_at).toLocaleDateString()}</span>
                  <span className="text-[9px] text-slate-300 font-medium uppercase tracking-tighter">{new Date(booking.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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

  const labels: Record<string, string> = {
    waiting: 'WAITLISTED',
    approved: 'POINTS CREDITED',
    rejected: 'REJECTED'
  };
  
  return (
    <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${styles[status]}`}>
      {labels[status] || status}
    </span>
  );
};

export default MyBookings;
