
import React, { useMemo } from 'react';
import { User, Booking } from '../types';
import { REWARD_CONVERSION_RATE } from '../constants';

interface DashboardProps {
  user: User;
  bookings: Booking[];
}

const Dashboard: React.FC<DashboardProps> = ({ user, bookings }) => {
  const stats = useMemo(() => {
    const userBookings = bookings.filter(b => b.user_id === user.id);
    const approved = userBookings.filter(b => b.status === 'approved');
    const totalPoints = approved.reduce((sum, b) => sum + b.points_earned, 0);
    
    return {
      total: userBookings.length,
      pending: userBookings.filter(b => b.status === 'waiting').length,
      approved: approved.length,
      points: totalPoints,
      amount: totalPoints / REWARD_CONVERSION_RATE
    };
  }, [bookings, user.id]);

  return (
    <div className="p-6 space-y-6">
      {/* Referral Code Card */}
      <div className="bg-gradient-to-br from-[#005696] to-blue-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden">
        <div className="relative z-10">
          <span className="text-xs opacity-80 font-medium tracking-widest uppercase">My ID Code</span>
          <h3 className="text-2xl font-black mt-1 tracking-wider">{user.referral_code}</h3>
          <p className="text-[10px] mt-2 opacity-70">Quote this ID for direct admin support</p>
        </div>
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Total Points" value={stats.points.toLocaleString()} subValue={`₹${stats.amount}`} color="blue" />
        <StatCard label="Approved" value={stats.approved} subValue="Bookings" color="emerald" />
        <StatCard label="Pending" value={stats.pending} subValue="Awaiting" color="amber" />
        <StatCard label="Total Orders" value={stats.total} subValue="Lifetime" color="slate" />
      </div>

      {/* Quick Action */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
        <div>
          <h4 className="font-bold text-slate-900">Need help?</h4>
          <p className="text-xs text-slate-500">Contact admin for queries</p>
        </div>
        <button className="px-4 py-2 bg-slate-50 text-[#005696] rounded-lg text-xs font-bold border border-slate-200">
          WhatsApp Support
        </button>
      </div>

      {/* Recent Activity Mini List */}
      <div className="space-y-3">
        <h4 className="font-bold text-slate-900 text-sm px-1">Recent Activity</h4>
        {bookings.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 text-xs">
            No bookings yet. Start your first order!
          </div>
        ) : (
          bookings.slice(0, 3).map(b => (
            <div key={b.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
              <div className={`w-2 h-2 rounded-full ${b.status === 'approved' ? 'bg-emerald-500' : b.status === 'rejected' ? 'bg-red-500' : 'bg-amber-500'}`} />
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-800 line-clamp-1">{b.product_name}</p>
                <p className="text-[10px] text-slate-500">{new Date(b.created_at).toLocaleDateString()}</p>
              </div>
              <span className="text-xs font-black text-slate-900">+{b.points_earned} pts</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string | number; subValue: string; color: string }> = ({ label, value, subValue, color }) => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    slate: 'bg-slate-50 text-slate-600 border-slate-100'
  };

  return (
    <div className={`p-4 rounded-3xl border ${colorMap[color]} flex flex-col items-center justify-center text-center space-y-1 shadow-sm`}>
      <span className="text-[10px] uppercase font-bold tracking-tight opacity-70">{label}</span>
      <span className="text-xl font-black">{value}</span>
      <span className="text-[10px] opacity-70 font-medium">{subValue}</span>
    </div>
  );
};

export default Dashboard;
