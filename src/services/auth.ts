import { supabase } from '../utils/supabase'
import { getTelegramUser, getOrCreateUser } from './telegram'

export const AuthService = {
  async signIn() {
    const user = await getOrCreateUser()
    return user
  },

  async getCurrentUser() {
    return await getTelegramUser()
  },

  async signOut() {
  }
}

export async function initAuth() {
  const tgUser = await getTelegramUser()
  if (!tgUser) return null

  const user = await getOrCreateUser()
  return user
}

export async function getUserProfile(telegramId: number) {
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', telegramId)
    .single()
  
  return data
}

export async function getUserById(userId: string) {
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  
  return data
}