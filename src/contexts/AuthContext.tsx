import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase } from '../utils/supabase'
import { getTelegramUser } from '../services/telegram'
import { RealtimeChannel } from '@supabase/supabase-js'

interface User {
  id: string
  telegram_id: number
  username: string | null
  full_name: string | null
  balance: number
  referral_count: number
  wallet_address?: string | null
  welcome_bonus_claimed?: boolean
  is_admin?: boolean
  is_premium?: boolean
  is_verified?: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  refreshUser: () => Promise<void>
  isNewUser: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
  isNewUser: false
})

export function useAuthContext() {
  return useContext(AuthContext)
}

async function callCreateUser() {
  const projectRef = import.meta.env.VITE_SUPABASE_URL?.replace('https://', '');
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!projectRef || !anonKey) {
    console.error('Missing Supabase env vars');
    return null;
  }

  const tg = (window as any).Telegram?.WebApp;
  const initData = tg?.initData;
  if (!initData) {
    console.error('No Telegram initData available');
    return null;
  }

  const response = await fetch(`https://${projectRef}/functions/v1/create-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${anonKey}`,
      'apikey': anonKey,
    },
    body: JSON.stringify({ initData }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    console.error('Create user failed:', err);
    return null;
  }

  const data = await response.json();
  return data.user || null;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isNewUser, setIsNewUser] = useState(false)
  const initialized = useRef(false)
  const channelRef = useRef<RealtimeChannel | null>(null)

  const initAuth = async () => {
    try {
      const tgUser = await getTelegramUser()
      
      if (!tgUser) {
        setLoading(false)
        return
      }

      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', tgUser.id)
        .limit(1)
        .maybeSingle()

      if (existingUser) {
        setUser(existingUser)
        setLoading(false)
        initialized.current = true
        subscribeToUserUpdates(tgUser.id)
        return
      }

      setIsNewUser(true)
      const newUser = await callCreateUser()

      if (newUser) {
        setUser(newUser)
        subscribeToUserUpdates(tgUser.id)
      }
    } catch (error) {
      console.error('Auth init error:', error)
    } finally {
      setLoading(false)
      initialized.current = true
    }
  }

  const refreshUser = async () => {
    if (!user?.telegram_id) return
    
    try {
      const { data: freshUser } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', user.telegram_id)
        .limit(1)
        .maybeSingle()
      
      if (freshUser) {
        setUser(freshUser)
      }
    } catch (error) {
      console.error('Refresh user error:', error)
    }
  }

  const subscribeToUserUpdates = (telegramId: number) => {
    if (channelRef.current) {
      channelRef.current.unsubscribe()
    }

    const channel = supabase
      .channel(`user-${telegramId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `telegram_id=eq.${telegramId}`
        },
        (payload) => {
          setUser((prev) => prev ? { ...prev, ...payload.new } : null)
        }
      )
      .subscribe()

    channelRef.current = channel
  }

  useEffect(() => {
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
      }
    }
  }, [])

  useEffect(() => {
    if (!initialized.current) {
      initAuth()
    } else {
      setLoading(false)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, isNewUser }}>
      {children}
    </AuthContext.Provider>
  )
}