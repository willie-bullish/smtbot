import { useState, useEffect } from 'react'
import { supabase, supabaseAdmin } from '../utils/supabase'
import { getTelegramUser, signUpWithTelegram } from '../services/telegram'

interface User {
  id: string
  telegram_id: number
  username: string | null
  full_name: string | null
  balance: number
  referral_count: number
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initAuth()
  }, [])

  const initAuth = async () => {
    try {
      setLoading(true)
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
      } else {
        const email = `telegram_${tgUser.id}@smtbot.app`
        const password = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: email,
          password: password,
          email_confirm: true,
          user_metadata: {
            telegram_id: tgUser.id,
            username: tgUser.username
          }
        })

        if (authError || !authData?.user) {
          console.error('Auth signup error:', authError)
          setLoading(false)
          return
        }

        const newAuthUser = authData.user

        const urlParams = new URLSearchParams(window.location.search)
        const startParam = urlParams.get('start')

        let referrerId: string | null = null
        if (startParam) {
          const { data: referrer } = await supabase
            .from('users')
            .select('id')
            .eq('telegram_id', parseInt(startParam))
            .single()
          
          if (referrer) referrerId = referrer.id
        }

        const { data: newUser } = await supabase
          .from('users')
          .insert({
            id: newAuthUser.id,
            telegram_id: tgUser.id,
            username: tgUser.username || `user_${tgUser.id}`,
            full_name: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || null,
            referrer_id: referrerId
          })
          .select()
          .single()

        if (newUser) {
          setUser(newUser)
        }
      }
    } catch (error) {
      console.error('Auth init error:', error)
    } finally {
      setLoading(false)
    }
  }

  return { user, loading }
}