
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { isSupabaseConfigured } from './services/supabase.ts';
import Layout from './components/Layout.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Tasks from './pages/Tasks.tsx';
import Wallet from './pages/Wallet.tsx';
import Profile from './pages/Profile.tsx';
import Admin from './pages/Admin.tsx';
import Auth from './pages/Auth.tsx';
import GlassCard from './components/GlassCard.tsx';
import { Loader2, Settings, AlertTriangle, ExternalLink } from 'lucide-react';

const SetupRequired: React.FC = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
    <GlassCard className="max-w-md w-full border-amber-500/30 text-center space-y-6">
      <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto">
        <AlertTriangle className="text-amber-500" size={32} />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-black">Supabase Required</h2>
        <p className="text-slate-400 text-sm">
          Please connect your own Supabase project to enable Authentication and the Database.
        </p>
      </div>
      <div className="bg-slate-900/50 p-4 rounded-xl text-left text-xs font-mono space-y-2 border border-white/5">
        <p className="text-emerald-400">// Update services/supabase.ts</p>
        <p>1. Create a project at supabase.com</p>
        <p>2. Run schema.sql in SQL Editor</p>
        <p>3. Copy URL & Anon Key to Env Vars</p>
      </div>
      <a 
        href="https://supabase.com" 
        target="_blank" 
        className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-500 text-slate-950 rounded-xl font-bold text-sm hover:bg-emerald-400 transition-colors"
      >
        OPEN SUPABASE <ExternalLink size={16} />
      </a>
    </GlassCard>
  </div>
);

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={48} />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

const App: React.FC = () => {
  if (!isSupabaseConfigured) {
    return <SetupRequired />;
  }

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
