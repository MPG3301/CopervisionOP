
import React, { useMemo, useState, useEffect } from 'react';
import { User, Booking } from '../types';
import { REWARD_CONVERSION_RATE } from '../constants';

interface DashboardProps {
  user: User;
  bookings: Booking[];
  deferredPrompt: any;
}

const Dashboard: React.FC<DashboardProps> = ({ user, bookings, deferredPrompt }) => {
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Check if the app is NOT already installed/standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    if (!isStandalone) {
      setShowInstallBanner(true);
    }
  }, []);

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

  const handleInstallClick = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    if (isIOS) {
      setShowIOSGuide(true);
    } else if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          setShowInstallBanner(false);
        }
      });
    } else {
      // General fallback or if prompt hasn't fired yet
      alert("To install, tap your browser's menu (three dots) and select 'Install App' or 'Add to Home Screen'.");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* SMART INSTALL BANNER */}
      {showInstallBanner && (
        <div className="bg-slate-900 rounded-[30px] p-5 flex items-center justify-between shadow-xl animate-in slide-in-from-top-4 duration-500">
           <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-[#005696] rounded-xl flex items-center justify-center text-white font-black text-xs shadow-lg shadow-blue-900/40">CV</div>
              <div className="flex flex-col">
                <p className="text-white text-[11px] font-black uppercase tracking-widest leading-none">Install App</p>
                <p className="text-slate-400 text-[9px] font-bold mt-1">Faster access & offline support</p>
              </div>
           </div>
           <button 
             onClick={handleInstallClick}
             className="bg-white text-slate-900 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform"
           >
              Setup
           </button>
        </div>
      )}

      {/* PROFESSIONAL IDENTITY CARD */}
      <div className="bg-gradient-to-br from-[#005696] to-blue-800 rounded-[35px] p-8 text-white shadow-2xl shadow-blue-900/30 relative overflow-hidden group">
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div>
            <div className="flex justify-between items-start mb-6">
               <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-60">Optometrist Identity</span>
               <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
               </div>
            </div>
            <h3 className="text-2xl font-black tracking-widest">{user.referral_code}</h3>
            <p className="text-[10px] font-bold opacity-60 mt-1 uppercase">Ref ID: {user.optometrist_id}</p>
          </div>
          <div className="mt-8 border-t border-white/10 pt-4">
             <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Registered Clinic</p>
             <p className="font-bold text-sm">{user.shop_name} • {user.city}</p>
          </div>
        </div>
        <div className="absolute -bottom-10 -right-10 opacity-5 transition-transform duration-700 group-hover:scale-125 group-hover:-rotate-12">
           <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
        </div>
      </div>

      {/* REWARDS QUICK GLANCE */}
      <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex justify-between items-center px-8">
         <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Points</p>
            <p className="text-2xl font-black text-slate-900">{stats.points.toLocaleString()}</p>
         </div>
         <div className="h-10 w-[2px] bg-slate-50"></div>
         <div className="text-center">
            <p className="text-[9px] font-black text-[#005696] uppercase tracking-widest mb-1">Wallet (₹)</p>
            <p className="text-2xl font-black text-[#005696]">₹{stats.amount.toLocaleString()}</p>
         </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <MiniStat label="Pending" value={stats.pending} color="bg-amber-500" />
        <MiniStat label="Approved" value={stats.approved} color="bg-emerald-500" />
      </div>

      <div className="bg-[#128C7E] rounded-[28px] p-6 text-white flex items-center justify-between shadow-xl shadow-green-900/10">
        <div>
          <h4 className="font-black text-sm uppercase tracking-widest leading-tight">Need Support?</h4>
          <p className="text-[10px] opacity-70 font-bold uppercase mt-1 tracking-tighter">Connect with admin on WhatsApp</p>
        </div>
        <a href={`https://wa.me/91XXXXXXXXXX?text=Help%20requested%20for%20Partner%20ID:%20${user.referral_code}`} target="_blank" className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center hover:bg-white/30 transition-all">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.417-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.305 1.652zm6.599-3.835c1.516.899 3.3 1.374 5.123 1.375 5.513 0 9.999-4.486 10.001-9.998.001-2.672-1.041-5.183-2.934-7.078-1.892-1.894-4.403-2.933-7.075-2.934-5.515 0-10.002 4.487-10.005 10.001-.001 1.776.463 3.511 1.341 5.021l-1.01 3.681 3.76-.986z"/></svg>
        </a>
      </div>

      {/* iOS INSTALL GUIDE MODAL */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="w-full max-w-sm bg-white rounded-[40px] p-8 shadow-2xl relative animate-in slide-in-from-bottom-10 duration-500">
              <button onClick={() => setShowIOSGuide(false)} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-900"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg></button>
              
              <div className="text-center mb-8">
                 <div className="w-16 h-16 bg-[#005696] rounded-3xl flex items-center justify-center text-white mx-auto mb-4 shadow-xl shadow-blue-900/20 font-black text-2xl">CV</div>
                 <h3 className="text-xl font-black text-slate-900">Install to iPhone</h3>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Get the native experience</p>
              </div>

              <div className="space-y-6">
                 <div className="flex items-start gap-4">
                    <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-500 shrink-0">1</div>
                    <p className="text-xs font-bold text-slate-600 leading-relaxed">Tap the <span className="text-[#005696] font-black underline">Share</span> button at the bottom of Safari.</p>
                 </div>
                 <div className="flex items-start gap-4">
                    <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-500 shrink-0">2</div>
                    <p className="text-xs font-bold text-slate-600 leading-relaxed">Scroll down and select <span className="text-slate-900 font-black">'Add to Home Screen'</span>.</p>
                 </div>
                 <div className="flex items-start gap-4">
                    <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-500 shrink-0">3</div>
                    <p className="text-xs font-bold text-slate-600 leading-relaxed">Tap <span className="text-blue-600 font-black">Add</span> in the top right corner.</p>
                 </div>
              </div>

              <button 
                onClick={() => setShowIOSGuide(false)}
                className="w-full mt-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs active:scale-95 transition-all"
              >
                Got it
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

const MiniStat = ({ label, value, color }: any) => (
  <div className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center text-center gap-1">
    <span className={`w-2 h-2 rounded-full ${color} mb-1 animate-pulse`}></span>
    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    <span className="text-xl font-black text-slate-800">{value}</span>
  </div>
);

export default Dashboard;
