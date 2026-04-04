import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useRouter, useSegments } from 'expo-router';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: any | null;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (tokens: { access_token: string; refresh_token: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    refreshToken: null,
    user: null,
    isLoading: true,
  });
  
  const router = useRouter();
  const segments = useSegments();

  // Load tokens from SecureStore on mount
  useEffect(() => {
    const loadTokens = async () => {
      try {
        const token = await SecureStore.getItemAsync('access_token');
        const refreshToken = await SecureStore.getItemAsync('refresh_token');
        
        if (token && refreshToken) {
          // TODO: Verify token validity or refresh it immediately
          setState({
            token,
            refreshToken,
            user: {}, // Decoded user info could go here
            isLoading: false,
          });
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (e) {
        console.error('Failed to load tokens', e);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };
    
    loadTokens();
  }, []);

  // Handle Automatic Redirects based on Auth State
  useEffect(() => {
    if (state.isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!state.token && !inAuthGroup) {
      // Redirect to login if NOT authenticated and NOT in auth group
      router.replace('/(auth)/login');
    } else if (state.token && inAuthGroup) {
      // Redirect to home if authenticated and in auth group
      router.replace('/(tabs)');
    }
  }, [state.token, state.isLoading, segments]);

  const login = async (tokens: { access_token: string; refresh_token: string }) => {
    await SecureStore.setItemAsync('access_token', tokens.access_token);
    await SecureStore.setItemAsync('refresh_token', tokens.refresh_token);
    
    setState({
      token: tokens.access_token,
      refreshToken: tokens.refresh_token,
      user: {}, // Should decode JWT here
      isLoading: false,
    });
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    setState({
      token: null,
      refreshToken: null,
      user: null,
      isLoading: false,
    });
  };

  // Background Token Refresh Logic
  useEffect(() => {
    if (!state.refreshToken) return;

    const interval = setInterval(async () => {
      try {
        console.log('[Auth] Refreshing token...');
        // TODO: Call Keycloak refresh endpoint
        // const response = await axios.post('KEYCLOAK_URL', { refresh_token: state.refreshToken });
        // await login(response.data);
      } catch (e) {
        console.error('Refresh token failed', e);
        logout();
      }
    }, 1000 * 60 * 25); // Refresh every 25 minutes (JWT usually 30m)

    return () => clearInterval(interval);
  }, [state.refreshToken]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
