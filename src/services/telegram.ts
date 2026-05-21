import { supabase } from '../utils/supabase'

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

async function callCreateUser(tgUser: TelegramUser, referrerTelegramId?: number) {
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

export async function getOrCreateUser(): Promise<any> {
  const tgUser = await getTelegramUser()
  if (!tgUser) return null

  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', tgUser.id)
    .single()

  if (existingUser) return existingUser

  const tg = (window as any).Telegram?.WebApp
  const urlParams = new URLSearchParams(window.location.search)
  const startParam = urlParams.get('start') || urlParams.get('startapp') || tg?.initDataUnsafe?.start_param || null

  let referrerTelegramId: number | undefined
  if (startParam) {
    referrerTelegramId = parseInt(startParam)
  }

  return await callCreateUser(tgUser, referrerTelegramId)
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
  const tg = (window as any).Telegram?.WebApp
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get('start') || urlParams.get('startapp') || tg?.initDataUnsafe?.start_param || null
}