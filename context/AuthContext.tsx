import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase.ts';
import { Profile } from '../types.ts';
import { TRANSLATIONS } from '../constants.tsx';

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  t: any;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  debugInfo: string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const t = TRANSLATIONS.bn;

  const addLog = (msg: string) => {
    const log = `${new Date().toLocaleTimeString()}: ${msg}`;
    console.log(`[Auth] ${msg}`);
    setDebugInfo(prev => [...prev.slice(-14), log]);
  };

  const fetchProfile = async (userId: string) => {
    setProfileLoading(true);
    addLog(`Fetching DB record for: ${userId}`);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        addLog(`DB ERROR: ${error.message}`);
        return null;
      }
      
      if (!data) {
        addLog("CRITICAL WARNING: Profile record NOT FOUND in database table!");
      } else {
        addLog(`Profile Loaded: ${data.email} (${data.role})`);
      }
      
      return data;
    } catch (err) {
      addLog(`CRITICAL FETCH ERROR: ${err}`);
      return null;
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSession = async (session: any) => {
    const u = session?.user ?? null;
    addLog(`Auth Status: ${u ? 'Logged In (' + u.email + ')' : 'Logged Out'}`);
    
    // 1. Immediately update user state
    setUser(u);
    
    // 2. Stop the global app loading immediately to allow routing
    setLoading(false);
    
    // 3. Background fetch the profile if user exists
    if (u) {
      const p = await fetchProfile(u.id);
      setProfile(p);
    } else {
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const p = await fetchProfile(user.id);
      setProfile(p);
    }
  };

  useEffect(() => {
    let mounted = true;
    addLog("Auth System Initializing...");

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) handleSession(session);
    }).catch(err => {
      addLog(`Session Retrieval Error: ${err.message}`);
      if (mounted) setLoading(false);
    });

    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      addLog(`Auth Event: ${event}`);
      if (mounted) handleSession(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    addLog("Signing out...");
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } finally {
      setProfile(null);
      setUser(null);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, profileLoading, t, signOut, refreshProfile, debugInfo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};