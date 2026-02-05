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
    console.log(`[AuthContext] ${msg}`);
    setDebugInfo(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const fetchProfile = async (userId: string) => {
    setProfileLoading(true);
    addLog(`Fetching profile for: ${userId}`);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        addLog(`DB Error: ${error.message}`);
        return null;
      }
      return data;
    } catch (err) {
      addLog(`Fetch error: ${err}`);
      return null;
    } finally {
      setProfileLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const p = await fetchProfile(user.id);
      setProfile(p);
    }
  };

  const handleSession = async (session: any) => {
    const u = session?.user ?? null;
    addLog(`Handle Session. User: ${u ? u.email : 'Guest'}`);
    
    // Step 1: Immediately set user and stop global loading
    setUser(u);
    setLoading(false);
    
    // Step 2: Fetch profile in background
    if (u) {
      const p = await fetchProfile(u.id);
      setProfile(p);
      addLog(p ? "Profile Loaded" : "Profile Missing from DB");
    } else {
      setProfile(null);
    }
  };

  useEffect(() => {
    let mounted = true;
    addLog("Auth Module Init");

    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) handleSession(session);
    }).catch(err => {
      addLog(`Session Error: ${err.message}`);
      if (mounted) setLoading(false);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) handleSession(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setProfile(null);
    setUser(null);
    setLoading(false);
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