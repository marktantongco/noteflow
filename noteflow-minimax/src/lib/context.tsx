'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { AppState, AppAction, Theme, TabId, User } from '@/types';
import { DEFAULT_NOTIFICATION_PREFS } from '@/lib/constants';
import { db } from '@/lib/db';

const initialState: AppState = {
  user: null,
  theme: 'dark',
  activeTab: 'journal',
  isLoading: true,
  isOffline: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_OFFLINE':
      return { ...state, isOffline: action.payload };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  setUser: (user: User | null) => void;
  setTheme: (theme: Theme) => void;
  setActiveTab: (tab: TabId) => void;
  login: (email: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const setUser = useCallback((user: User | null) => {
    dispatch({ type: 'SET_USER', payload: user });
  }, []);

  const setTheme = useCallback((theme: Theme) => {
    dispatch({ type: 'SET_THEME', payload: theme });
    localStorage.setItem('noteflow-theme', theme);
  }, []);

  const setActiveTab = useCallback((tab: TabId) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
  }, []);

  const login = useCallback(async (email: string, name: string) => {
    const userId = crypto.randomUUID();
    const user: User = {
      id: userId,
      email,
      name,
      createdAt: new Date().toISOString(),
      notificationPrefs: DEFAULT_NOTIFICATION_PREFS,
    };

    await db.users.put(user);
    setUser(user);
  }, [setUser]);

  const logout = useCallback(async () => {
    setUser(null);
  }, [setUser]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('noteflow-theme') as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }

    const handleOnline = () => dispatch({ type: 'SET_OFFLINE', payload: false });
    const handleOffline = () => dispatch({ type: 'SET_OFFLINE', payload: true });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    dispatch({ type: 'SET_OFFLINE', payload: !navigator.onLine });
    dispatch({ type: 'SET_LOADING', payload: false });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setTheme]);

  useEffect(() => {
    const root = document.documentElement;
    if (state.theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('light', !isDark);
    } else {
      root.classList.toggle('light', state.theme === 'light');
    }
  }, [state.theme]);

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        setUser,
        setTheme,
        setActiveTab,
        login,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

export function useTheme() {
  const { state, setTheme } = useApp();
  return { theme: state.theme, setTheme };
}

export function useUser() {
  const { state, login, logout } = useApp();
  return { user: state.user, login, logout };
}

export function useActiveTab() {
  const { state, setActiveTab } = useApp();
  return { activeTab: state.activeTab, setActiveTab };
}
