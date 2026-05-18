import { supabase, supabaseAdmin } from '../utils/supabase'

export interface TelegramUser {
  id: number
  username?: string
  first_name: string
  last_name?: string
}

export async function getTelegramUser(): Promise<TelegramUser | null> {
  const tg = (window as any).Telegram?.WebApp
  const initData = tg?.initData || ''
  
  if (!initData) return null

  const params = new URLSearchParams(initData)
  const userStr = params.get('user')
  
  if (!userStr) return null

  try {
    return JSON.parse(decodeURIComponent(userStr))
  } catch {
    return null
  }
}

export async function signUpWithTelegram(tgUser: TelegramUser): Promise<any> {
  const email = `telegram_${tgUser.id}@smtbot.app`
  const password = generateRandomPassword()

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
    user_metadata: {
      telegram_id: tgUser.id,
      username: tgUser.username,
      first_name: tgUser.first_name,
      last_name: tgUser.last_name
    }
  })

  if (authError) {
    console.error('Auth signup error:', authError)
    return null
  }

  return authData.user
}

export async function getOrCreateUser(): Promise<any> {
  const tgUser = await getTelegramUser()
  if (!tgUser) return null

  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', tgUser.id)
    .single()

  if (existingUser) return existingUser

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

  const authUser = await signUpWithTelegram(tgUser)
  if (!authUser) return null

  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
      id: authUser.id,
      telegram_id: tgUser.id,
      username: tgUser.username || `user_${tgUser.id}`,
      full_name: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || null,
      referrer_id: referrerId
    })
    .select()
    .single()

  if (error) {
    console.error('Create user error:', error)
    return null
  }

  return newUser
}

function generateRandomPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let password = ''
  for (let i = 0; i < 32; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export async function getUserByTelegramId(telegramId: number) {
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', telegramId)
    .single()
  
  return data
}

export function getReferrerFromUrl(): string | null {
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get('start')
}