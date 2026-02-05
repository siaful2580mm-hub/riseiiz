
import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Wallet, CheckSquare, User, Shield, MessageCircle, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { supabase } from '../services/supabase.ts';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { profile, user, t } = useAuth();
  const [supportLink, setSupportLink] = useState('https://t.me/riseiipro');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase.from('system_settings').select('notice_link').single();
        if (data?.notice_link) setSupportLink(data.notice_link);
      } catch (e) {
        console.error("Error fetching settings:", e);
      }
    };
    fetchSettings();
  }, []);

  const isOwner = user?.email === 'rakibulislamrovin@gmail.com';
  const isAdmin = profile?.role === 'admin' || isOwner;

  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center w-full h-full space-y-1 transition-all relative group ${
          isActive 
            ? 'text-[#00f2ff]' 
            : 'text-slate-500 hover:text-slate-300'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div className={`relative transition-all duration-300 ${isActive ? 'scale-110' : 'scale-100'}`}>
            <Icon size={22} className={isActive ? 'drop-shadow-[0_0_8px_rgba(0,242,255,0.6)]' : ''} />
            {isActive && (
              <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-[#00f2ff] rounded-full blur-[1px] animate-pulse"></div>
            )}
          </div>
          <span className={`text-[9px] font-black tracking-widest uppercase transition-all duration-300 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-60 -translate-y-0.5'}`}>
            {label}
          </span>
          {isActive && (
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-[2px] bg-gradient-to-r from-transparent via-[#00f2ff] to-transparent shadow-[0_0_10px_#00f2ff]"></div>
          )}
        </>
      )}
    </NavLink>
  );

  return (
    <div className="min-h-screen bg-[#05060f] text-slate-100 flex flex-col">
      <header className="sticky top-0 z-40 w-full glass px-4 py-4 flex justify-between items-center shadow-[0_4px_30px_rgba(0,0,0,0.5)] border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(0,242,255,0.3)]">
            <Zap size={18} className="text-[#05060f] fill-current" />
          </div>
          <h1 className="text-xl font-black bg-gradient-to-r from-[#00f2ff] to-[#7b61ff] bg-clip-text text-transparent tracking-tighter">
            RISEII PRO
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass-dark px-3 py-1.5 rounded-full border border-[#00f2ff]/20">
            <span className="text-[#00f2ff] font-black text-xs">৳ {profile?.balance?.toFixed(2) || '0.00'}</span>
          </div>
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#00f2ff]/30 bg-slate-800 flex items-center justify-center shadow-[0_0_10px_rgba(0,242,255,0.2)]">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={18} className="text-slate-500" />
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 pb-32 px-4 pt-6 max-w-4xl mx-auto w-full relative">
        {children}
        
        {/* Support Floating Widget */}
        <a 
          href={supportLink}
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-24 right-4 z-[60] group"
        >
          <div className="w-14 h-14 bg-gradient-primary rounded-full flex items-center justify-center text-[#05060f] shadow-[0_0_20px_rgba(0,242,255,0.4)] active:scale-90 transition-all duration-300">
             <MessageCircle size={28} />
             <div className="absolute inset-0 rounded-full bg-[#00f2ff] animate-ping opacity-20 pointer-events-none"></div>
          </div>
        </a>
      </main>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-lg h-18 floating-nav flex justify-around items-center px-4 shadow-[0_8px_32px_rgba(0,0,0,0.8)]">
        <NavItem to="/" icon={Home} label={t.home} />
        <NavItem to="/tasks" icon={CheckSquare} label={t.tasks} />
        <NavItem to="/wallet" icon={Wallet} label={t.wallet} />
        {isAdmin && (
          <NavItem to="/admin" icon={Shield} label={t.admin_panel} />
        )}
        <NavItem to="/profile" icon={User} label={t.profile} />
      </div>
    </div>
  );
};

export default Layout;
