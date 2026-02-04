
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Wallet, CheckSquare, User, LayoutDashboard, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  const { profile, user } = useAuth();

  // Hard check for the specific admin email
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
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </NavLink>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="sticky top-0 z-40 w-full glass px-4 py-3 flex justify-between items-center shadow-lg">
        <div className="flex items-center space-y-1">
          <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
            Riseii Pro
          </h1>
          {isAdmin && <span className="ml-2 px-1.5 py-0.5 rounded bg-emerald-500 text-[8px] font-black text-slate-950 uppercase animate-pulse">Admin</span>}
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

      <main className="flex-1 pb-24 px-4 pt-6 max-w-4xl mx-auto w-full">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bottom-nav-blur border-t border-white/10 flex justify-around items-center px-2">
        <NavItem to="/" icon={Home} label="Home" />
        <NavItem to="/tasks" icon={CheckSquare} label="Tasks" />
        <NavItem to="/wallet" icon={Wallet} label="Wallet" />
        {isAdmin && (
          <NavItem to="/admin" icon={Shield} label="Panel" special={true} />
        )}
        <NavItem to="/profile" icon={User} label="Profile" />
      </nav>
    </div>
  );
};

export default Layout;
