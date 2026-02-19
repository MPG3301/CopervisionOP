
import React, { useState, useMemo, useEffect } from 'react';
import { User, Booking, Withdrawal } from '../types';
import { REWARD_CONVERSION_RATE, MIN_WITHDRAWAL_POINTS } from '../constants';
import { supabase } from '../lib/supabase';

interface RewardsProps {
  user: User;
  bookings: Booking[];
  withdrawals: Withdrawal[];
  onWithdraw: (w: Withdrawal) => void;
}

const Rewards: React.FC<RewardsProps> = ({ user, bookings, withdrawals, onWithdraw }) => {
  const [upiId, setUpiId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  );

  const stats = useMemo(() => {
    const totalEarned = bookings
      .filter(b => b.status === 'approved' && b.user_id === user.id)
      .reduce((sum, b) => sum + b.points_earned, 0);
    
    const totalRedeemed = withdrawals
      .filter(w => w.user_id === user.id && w.status !== 'rejected')
      .reduce((sum, w) => sum + w.points, 0);
      
    const available = Math.max(0, totalEarned - totalRedeemed);
    
    return {
      earned: totalEarned,
      available,
      amount: available / REWARD_CONVERSION_RATE,
      redeemed: totalRedeemed
    };
  }, [bookings, withdrawals, user.id]);

  const requestNotifPermission = async () => {
    if (!('Notification' in window)) return alert('Notifications not supported');
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
    if (permission === 'granted') {
      new Notification("Alerts Enabled!", { body: "You will now receive updates on your payouts." });
    }
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stats.available < MIN_WITHDRAWAL_POINTS) {
      return alert(`Threshold not met. Min: ${MIN_WITHDRAWAL_POINTS} points.`);
    }
    if (!upiId.includes('@')) return alert('Invalid UPI ID Format');

    setIsProcessing(true);
    try {
      const withdrawalData = {
        id: `WTH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        user_id: user.id,
        points: stats.available,
        amount: stats.amount,
        upi_id: upiId,
        status: 'pending'
      };

      const { error } = await supabase.from('withdrawals').insert([withdrawalData]);
      if (error) throw error;

      onWithdraw(withdrawalData as any);
      setUpiId('');
      alert('Withdrawal request raised successfully!');
    } catch (err: any) {
      alert("Withdrawal failed: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <div className="text-center">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Wallet Hub</h2>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Earned points to cash payouts</p>
      </div>

      {/* NOTIFICATION PERMISSION CARD */}
      {notifPermission !== 'granted' && (
        <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-[30px] flex items-center justify-between gap-4">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#005696] shadow-sm"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg></div>
              <p className="text-[10px] font-black text-[#005696] uppercase tracking-widest">Enable payout alerts</p>
           </div>
           <button onClick={requestNotifPermission} className="bg-[#005696] text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-transform">Enable</button>
        </div>
      )}

      <div className="bg-white rounded-[45px] p-10 border border-slate-100 shadow-[0_15px_30px_rgba(0,0,0,0.03)] flex flex-col items-center text-center relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
           <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
        </div>
        <div className="w-20 h-20 bg-blue-50 rounded-[28px] flex items-center justify-center mb-6 shadow-sm">
          <svg className="w-10 h-10 text-[#005696]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest leading-none mb-1">Available to Redeem</span>
        <h3 className="text-5xl font-black text-slate-900 tracking-tighter">₹{stats.amount.toLocaleString()}</h3>
        <p className="text-[11px] font-black text-[#005696] mt-4 bg-blue-50 px-4 py-1.5 rounded-full uppercase tracking-tighter">{stats.available.toLocaleString()} Points Total</p>
      </div>

      <form onSubmit={handleRedeem} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Verified UPI ID</label>
          <input 
            type="text" placeholder="name@okaxis" required
            className="w-full px-6 py-5 bg-white border-2 border-slate-50 rounded-2xl outline-none focus:border-[#005696] text-lg font-black tracking-tight transition-all"
            value={upiId} onChange={(e) => setUpiId(e.target.value)}
          />
        </div>
        <button 
          disabled={stats.available < MIN_WITHDRAWAL_POINTS || isProcessing}
          className={`w-full py-6 rounded-3xl font-black text-lg text-white shadow-2xl transition-all active:scale-95 ${stats.available < MIN_WITHDRAWAL_POINTS ? 'bg-slate-300 shadow-none' : 'bg-slate-900 shadow-slate-900/30'}`}
        >
          {isProcessing ? 'Verifying...' : `Withdraw ₹${stats.amount}`}
        </button>
        {stats.available < MIN_WITHDRAWAL_POINTS && (
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3">
             <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
             <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest">
                Min. Withdrawal is {MIN_WITHDRAWAL_POINTS} points (₹500)
             </p>
          </div>
        )}
      </form>

      <div className="space-y-4 pt-6 border-t border-slate-50">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Payout History</h4>
        {withdrawals.length === 0 ? (
          <div className="py-12 text-center text-slate-300 font-bold italic text-xs uppercase tracking-widest">No history found</div>
        ) : (
          withdrawals.map(w => (
            <div key={w.id} className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex justify-between items-center group">
              <div>
                <p className="text-base font-black text-slate-900 leading-none">₹{w.amount}</p>
                <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">{w.upi_id}</p>
                <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1">ID: {w.id}</p>
              </div>
              <div className="text-right">
                <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-xl border ${w.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                   {w.status === 'approved' ? 'PAID' : 'PENDING'}
                </span>
                <p className="text-[9px] text-slate-300 mt-2 font-bold">{new Date(w.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Rewards;
