
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Wallet, CheckSquare, User, LayoutDashboard, Settings, LogOut, ShieldCheck } from 'lucide-react';
import { db } from '../services/mockDb';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  const user = db.user;

  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
          isActive ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
        }`
      }
    >
      <Icon size={24} />
      <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
    </NavLink>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full glass px-4 py-3 flex justify-between items-center shadow-lg">
        <div className="flex items-center space-y-1">
          <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
            Riseii Pro
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:block glass-dark px-3 py-1 rounded-full border border-emerald-500/20">
            <span className="text-emerald-400 font-bold">৳ {user.balance.toFixed(2)}</span>
          </div>
          <div className="w-8 h-8 rounded-full overflow-hidden border border-emerald-500/30">
            <img src={user.avatar_url || 'https://picsum.photos/32'} alt="avatar" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-24 px-4 pt-6 max-w-4xl mx-auto w-full">
        {children}
      </main>

      {/* Bottom Navigation (Mobile/Standard) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bottom-nav-blur border-t border-white/10 flex justify-around items-center px-2">
        {user.role === 'admin' && isAdminPath ? (
          <>
            <NavItem to="/admin" icon={LayoutDashboard} label="Admin" />
            <NavItem to="/admin/tasks" icon={Settings} label="Tasks" />
            <NavItem to="/admin/payouts" icon={Wallet} label="Payouts" />
            <NavItem to="/" icon={Home} label="Home" />
          </>
        ) : (
          <>
            <NavItem to="/" icon={Home} label="Home" />
            <NavItem to="/tasks" icon={CheckSquare} label="Tasks" />
            <NavItem to="/wallet" icon={Wallet} label="Wallet" />
            <NavItem to="/profile" icon={User} label="Profile" />
          </>
        )}
      </nav>
    </div>
  );
};

export default Layout;
