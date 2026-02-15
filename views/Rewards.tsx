
import React, { useState, useMemo } from 'react';
import { User, Booking, Withdrawal } from '../types';
import { REWARD_CONVERSION_RATE, MIN_WITHDRAWAL_POINTS } from '../constants';

interface RewardsProps {
  user: User;
  bookings: Booking[];
  withdrawals: Withdrawal[];
  onWithdraw: (w: Withdrawal) => void;
}

const Rewards: React.FC<RewardsProps> = ({ user, bookings, withdrawals, onWithdraw }) => {
  const [upiId, setUpiId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const stats = useMemo(() => {
    const totalEarned = bookings
      .filter(b => b.status === 'approved' && b.user_id === user.id)
      .reduce((sum, b) => sum + b.points_earned, 0);
    
    const totalRedeemed = withdrawals
      .filter(w => w.user_id === user.id && w.status !== 'rejected')
      .reduce((sum, w) => sum + w.points, 0);
      
    const available = totalEarned - totalRedeemed;
    
    return {
      earned: totalEarned,
      available,
      amount: available / REWARD_CONVERSION_RATE,
      redeemed: totalRedeemed
    };
  }, [bookings, withdrawals, user.id]);

  const handleRedeem = (e: React.FormEvent) => {
    e.preventDefault();
    if (stats.available < MIN_WITHDRAWAL_POINTS) {
      return alert(`Minimum ${MIN_WITHDRAWAL_POINTS} points required to redeem.`);
    }
    if (!upiId.includes('@')) {
      return alert('Invalid UPI ID');
    }

    setIsProcessing(true);
    setTimeout(() => {
      const newWithdrawal: Withdrawal = {
        id: Math.random().toString(36).substr(2, 9),
        user_id: user.id,
        points: stats.available,
        amount: stats.amount,
        upi_id: upiId,
        status: 'pending',
        created_at: new Date().toISOString()
      };
      onWithdraw(newWithdrawal);
      setUpiId('');
      setIsProcessing(false);
      alert('Withdrawal request submitted! Admin will process within 24-48 hours.');
    }, 1500);
  };

  return (
    <div className="p-6 space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Earnings</h2>
        <p className="text-sm text-slate-500">Track and redeem your rewards</p>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-[#005696]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Redeemable Balance</span>
        <h3 className="text-4xl font-black text-slate-900 mt-1">₹{stats.amount.toLocaleString()}</h3>
        <p className="text-xs font-bold text-[#005696] mt-2">{stats.available.toLocaleString()} Points Available</p>
      </div>

      <form onSubmit={handleRedeem} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-400 uppercase px-2">Transfer to UPI ID</label>
          <input 
            type="text" 
            placeholder="e.g. username@okaxis" 
            required
            className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#005696] text-lg font-medium"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
          />
        </div>
        <button 
          disabled={stats.available < MIN_WITHDRAWAL_POINTS || isProcessing}
          className={`w-full py-4 rounded-2xl font-black text-white shadow-xl shadow-blue-900/10 transition-all ${stats.available < MIN_WITHDRAWAL_POINTS ? 'bg-slate-300' : 'bg-[#005696] hover:bg-blue-800'}`}
        >
          {isProcessing ? 'Processing...' : `Redeem ₹${stats.amount}`}
        </button>
        {stats.available < MIN_WITHDRAWAL_POINTS && (
          <p className="text-[10px] text-center text-slate-400 font-medium">
            Min. redemption is {MIN_WITHDRAWAL_POINTS} points (₹{MIN_WITHDRAWAL_POINTS / REWARD_CONVERSION_RATE})
          </p>
        )}
      </form>

      <div className="space-y-4 pt-4 border-t border-slate-100">
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Withdrawal Status</h4>
        {withdrawals.filter(w => w.user_id === user.id).length === 0 ? (
          <p className="text-center py-6 text-slate-400 text-xs italic">No redemption requests yet</p>
        ) : (
          withdrawals.filter(w => w.user_id === user.id).map(w => (
            <div key={w.id} className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-slate-800">₹{w.amount}</p>
                <p className="text-[10px] text-slate-500">{w.upi_id}</p>
              </div>
              <div className="text-right">
                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${w.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {w.status}
                </span>
                <p className="text-[9px] text-slate-400 mt-1">{new Date(w.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Rewards;
