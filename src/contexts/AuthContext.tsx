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
}

interface AuthContextType {
  user: User | null
  loading: boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {}
})

export function useAuthContext() {
  return useContext(AuthContext)
}

async function callCreateUser(tgUser: { id: number; username?: string; first_name: string; last_name?: string }, referrerTelegramId?: number) {
  const projectRef = import.meta.env.VITE_SUPABASE_URL?.replace('https://', '');
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!projectRef || !anonKey) {
    console.error('Missing Supabase env vars');
    return null;
  }

  const response = await fetch(`https://${projectRef}/functions/v1/create-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${anonKey}`,
      'apikey': anonKey,
    },
    body: JSON.stringify({
      telegram_id: tgUser.id,
      username: tgUser.username || `user_${tgUser.id}`,
      full_name: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || null,
      referrer_telegram_id: referrerTelegramId || undefined,
    }),
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
        .single()

      if (existingUser) {
        setUser(existingUser)
        setLoading(false)
        initialized.current = true
        subscribeToUserUpdates(tgUser.id)
        return
      }

      const tg = (window as any).Telegram?.WebApp
      const urlParams = new URLSearchParams(window.location.search)
      const startParam = urlParams.get('start') || urlParams.get('startapp') || tg?.initDataUnsafe?.start_param || null

      let referrerTelegramId: number | undefined
      if (startParam) {
        referrerTelegramId = parseInt(startParam)
      }

      const newUser = await callCreateUser(tgUser, referrerTelegramId)

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
        .single()
      
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
    <AuthContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}