
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Wallet, CheckSquare, User, LayoutDashboard, Shield, MessageCircle, Languages } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { supabase } from '../services/supabase.ts';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  const { profile, user, language, setLanguage, t } = useAuth();
  const [supportLink, setSupportLink] = useState('https://t.me/riseiipro');

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('system_settings').select('notice_link').single();
      if (data?.notice_link) setSupportLink(data.notice_link);
    };
    fetchSettings();
  }, []);

  const isOwner = user?.email === 'rakibulislamrovin@gmail.com';
  const isAdmin = profile?.role === 'admin' || isOwner;

  const NavItem = ({ to, icon: Icon, label, special }: { to: string; icon: any; label: string; special?: boolean }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center w-full h-full space-y-1 transition-all ${
          isActive 
            ? special ? 'text-emerald-400 scale-110' : 'text-emerald-400' 
            : special ? 'text-emerald-500/60 font-black' : 'text-slate-400 hover:text-slate-200'
        }`
      }
    >
      <Icon size={special ? 26 : 24} />
      <span className={`text-[10px] font-bold uppercase tracking-wider ${language === 'bn' ? 'font-medium scale-90' : ''}`}>{label}</span>
    </NavLink>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="sticky top-0 z-40 w-full glass px-4 py-3 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
            Riseii Pro
          </h1>
          <button 
            onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
            className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg border border-white/10 text-[10px] font-black text-emerald-400 hover:bg-white/10 transition-all uppercase tracking-tighter"
          >
            <Languages size={12} /> {language === 'en' ? 'BN' : 'EN'}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:block glass-dark px-3 py-1 rounded-full border border-emerald-500/20">
            <span className="text-emerald-400 font-bold">৳ {profile?.balance?.toFixed(2) || '0.00'}</span>
          </div>
          <div className="w-8 h-8 rounded-full overflow-hidden border border-emerald-500/30 bg-slate-800 flex items-center justify-center">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={16} className="text-slate-500" />
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 pb-24 px-4 pt-6 max-w-4xl mx-auto w-full relative">
        {children}
        
        {/* Support Floating Widget */}
        <a 
          href={supportLink}
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-20 right-4 z-[60] flex items-center gap-2 group"
        >
          <div className="bg-slate-900/90 backdrop-blur-md border border-emerald-500/30 px-3 py-2 rounded-2xl text-[10px] font-black text-emerald-400 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 shadow-2xl uppercase">
            {t.support}
          </div>
          <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/40 relative active:scale-90 transition-transform">
             <MessageCircle size={28} />
             <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-20 pointer-events-none"></div>
          </div>
        </a>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bottom-nav-blur border-t border-white/10 flex justify-around items-center px-2">
        <NavItem to="/" icon={Home} label={t.home} />
        <NavItem to="/tasks" icon={CheckSquare} label={t.tasks} />
        <NavItem to="/wallet" icon={Wallet} label={t.wallet} />
        {isAdmin && (
          <NavItem to="/admin" icon={Shield} label={t.admin_panel} special={true} />
        )}
        <NavItem to="/profile" icon={User} label={t.profile} />
      </nav>
    </div>
  );
};

export default Layout;
