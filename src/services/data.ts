import { supabase } from '../utils/supabase'

const TIMEOUT_MS = 8000

export const DataService = {
  async getAnnouncements() {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
    
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })
      clearTimeout(timeout)
      if (error) throw error
      return data || []
    } catch (e) {
      clearTimeout(timeout)
      console.error('Get announcements failed:', e)
      return []
    }
  },

  async getLeaderboard(limit = 100) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
    
    try {
      const { data, error } = await supabase.rpc('get_public_leaderboard', {
        p_limit: limit,
        p_offset: 0
      })
      clearTimeout(timeout)
      if (error) throw error
      return data || []
    } catch (e) {
      clearTimeout(timeout)
      console.error('Leaderboard fetch failed:', e)
      return []
    }
  },

  async getUserRank(userId: string) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
    
    try {
      const { data, error } = await supabase.rpc('get_user_rank', {
        p_user_id: userId
      })
      clearTimeout(timeout)
      if (error) throw error
      return data
    } catch (e) {
      clearTimeout(timeout)
      console.error('Get rank failed:', e)
      return null
    }
  },

  async getUserReferralRewards(userId: string) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const { data, error } = await supabase
        .from('referral_rewards')
        .select('id, referred_user_id, reward_amount, created_at')
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)
      clearTimeout(timeout)
      if (error) throw error
      return data || []
    } catch (e) {
      clearTimeout(timeout)
      console.error('Get referral rewards failed:', e)
      return []
    }
  },

  async getUserReferrals(userId: string) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, full_name, created_at')
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)
      clearTimeout(timeout)
      if (error) throw error
      return data || []
    } catch (e) {
      clearTimeout(timeout)
      console.error('Get referrals failed:', e)
      return []
    }
  },

  async getTasks() {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
    
    try {
      console.log('DataService.getTasks: fetching...');
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: true })
      console.log('DataService.getTasks: data:', data, 'error:', error);
      clearTimeout(timeout)
      if (error) throw error
      return data || []
    } catch (e) {
      clearTimeout(timeout)
      console.error('Get tasks failed:', e)
      return []
    }
  },

  async getUserTaskCompletions(userId: string) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
    
    try {
      const { data, error } = await supabase
        .from('task_completions')
        .select('task_id, verified, completed_at')
        .eq('user_id', userId)
      clearTimeout(timeout)
      if (error) throw error
      return data || []
    } catch (e) {
      clearTimeout(timeout)
      console.error('Get completions failed:', e)
      return []
    }
  },

  async completeTask(userId: string, taskId: number) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
    
    try {
      console.log('completeTask: inserting', { userId, taskId });
      const { data, error } = await supabase.from('task_completions').insert({
        user_id: userId,
        task_id: taskId
      }).select();
      console.log('completeTask: result', { data, error });
      clearTimeout(timeout)
      if (error && error.code !== '23505') throw error
      return true
    } catch (e) {
      clearTimeout(timeout)
      console.error('Complete task failed:', e)
      return false
    }
  },

  async deleteTaskCompletion(userId: string, taskId: number) {
    try {
      const { error } = await supabase
        .from('task_completions')
        .delete()
        .eq('user_id', userId)
        .eq('task_id', taskId)
      if (error) throw error
      return true
    } catch (e) {
      console.error('Delete task completion failed:', e)
      return false
    }
  },

  async getUserProfile(userId: string) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      clearTimeout(timeout)
      if (error) throw error
      return data
    } catch (e) {
      clearTimeout(timeout)
      console.error('Get profile failed:', e)
      return null
    }
  },

  async verifyTask(userId: string, taskId: number, verified: boolean = true) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
    
    try {
      console.log('verifyTask: updating', { userId, taskId, verified });
      const { data, error } = await supabase
        .from('task_completions')
        .update({ verified: verified })
        .eq('user_id', userId)
        .eq('task_id', taskId)
        .select()
      console.log('verifyTask: result', { data, error });
      clearTimeout(timeout)
      if (error) throw error
      return data?.[0] || null
    } catch (e) {
      clearTimeout(timeout)
      console.error('Verify task failed:', e)
      return null
    }
  },

  async autoVerifyAndCredit(userId: string, taskId: number) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
    
    try {
      const { data, error } = await supabase.rpc('verify_and_credit_task', {
        p_user_id: userId,
        p_task_id: taskId
      })
      clearTimeout(timeout)
      if (error) throw error
      return data
    } catch (e) {
      clearTimeout(timeout)
      console.error('Auto verify failed:', e)
      return false
    }
  },

  async verifyTelegramMembership(userTelegramId: number, chatId: string) {
    try {
      const projectRef = import.meta.env.VITE_SUPABASE_URL?.replace('https://', '');
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!projectRef || !anonKey) {
        console.error('Missing Supabase env vars');
        return false;
      }
      
      const response = await fetch(`https://${projectRef}/functions/v1/verify-telegram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
          'apikey': anonKey
        },
        body: JSON.stringify({
          user_telegram_id: userTelegramId,
          chat_id: chatId
        })
      });
      
      if (!response.ok) {
        console.error('Telegram verification request failed:', response.status);
        return false;
      }
      
      const data = await response.json();
      console.log('Telegram verification result:', data);
      return data.verified === true;
    } catch (e) {
      console.error('Telegram verification failed:', e);
      return false;
    }
  },

  async creditWelcomeBonus(userId: string, amount: number = 1000) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
    
    try {
      const { data, error } = await supabase.rpc('credit_welcome_bonus', {
        p_user_id: userId,
        p_amount: amount
      })
      clearTimeout(timeout)
      if (error) throw error
      return data
    } catch (e) {
      clearTimeout(timeout)
      console.error('Welcome bonus failed:', e)
      return false
    }
  },

  async saveWalletAddress(userId: string, walletAddress: string) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
    
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ wallet_address: walletAddress })
        .eq('id', userId)
        .select()
        .single()
      clearTimeout(timeout)
      if (error) throw error
      return data
    } catch (e) {
      clearTimeout(timeout)
      console.error('Save wallet failed:', e)
      return null
    }
  }
}