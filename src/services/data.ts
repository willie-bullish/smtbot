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
        .select('id, username, full_name, created_at, is_verified')
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
        .order('referral_target', { ascending: true })
        .order('id', { ascending: true })
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

  async creditWelcomeBonus(userId: string) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
    
    try {
      const { data, error } = await supabase.rpc('credit_welcome_bonus', {
        p_user_id: userId
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

  async getTotalClaimed() {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      const { data, error } = await supabase.rpc('get_total_claimed')
      clearTimeout(timeout)
      if (error) throw error
      return data || 0
    } catch (e) {
      clearTimeout(timeout)
      console.error('Get total claimed failed:', e)
      return 0
    }
  },

  async createStarsInvoice(userId: string, type: 'upgrade' | 'verify' = 'upgrade') {
    const projectRef = import.meta.env.VITE_SUPABASE_URL?.replace('https://', '');
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!projectRef || !anonKey) return null;

    try {
      const resp = await fetch(`https://${projectRef}/functions/v1/create-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${anonKey}` },
        body: JSON.stringify({ user_id: userId, type }),
      });
      if (!resp.ok) return null;
      const data = await resp.json();
      return data.url || null;
    } catch { return null; }
  },

  async verifyPayment(userId: string, method: 'stars' | 'ton', txHash?: string, type: 'upgrade' | 'verify' = 'upgrade', userWallet?: string) {
    const projectRef = import.meta.env.VITE_SUPABASE_URL?.replace('https://', '');
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!projectRef || !anonKey) return false;

    try {
      const resp = await fetch(`https://${projectRef}/functions/v1/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${anonKey}` },
        body: JSON.stringify({ user_id: userId, method, tx_hash: txHash, type, user_wallet: userWallet }),
      });
      if (!resp.ok) return false;
      const data = await resp.json();
      return data.upgraded === true;
    } catch { return false; }
  },

  async verifyUser(userId: string) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      const { data, error } = await supabase.rpc('verify_user', { p_user_id: userId })
      clearTimeout(timeout)
      if (error) throw error
      return data
    } catch (e) {
      clearTimeout(timeout)
      console.error('Verify user failed:', e)
      return false
    }
  },

  async upgradeUser(userId: string) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      const { data, error } = await supabase.rpc('upgrade_user', { p_user_id: userId })
      clearTimeout(timeout)
      if (error) throw error
      return data
    } catch (e) {
      clearTimeout(timeout)
      console.error('Upgrade user failed:', e)
      return false
    }
  },

  async saveWalletAddress(userId: string, walletAddress: string) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
    
    try {
      const { data, error } = await supabase.rpc('save_wallet_address', {
        p_user_id: userId,
        p_wallet_address: walletAddress
      })
      clearTimeout(timeout)
      if (error) throw error
      return data
    } catch (e) {
      clearTimeout(timeout)
      console.error('Save wallet failed:', e)
      return null
    }
  },

  async adminAddTask(adminId: string, task: {
    title: string
    reward: number
    link_url?: string
    verify_type?: string
    referral_target?: number
    telegram_chat_id?: string
  }) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      const { data, error } = await supabase.rpc('admin_add_task', {
        p_admin_id: adminId,
        p_title: task.title,
        p_reward: task.reward,
        p_link_url: task.link_url || null,
        p_verify_type: task.verify_type || 'manual',
        p_referral_target: task.referral_target || 0,
        p_telegram_chat_id: task.telegram_chat_id || null,
      })
      clearTimeout(timeout)
      if (error) throw error
      return data
    } catch (e) {
      clearTimeout(timeout)
      console.error('Admin add task failed:', e)
      return null
    }
  },

  async adminAddAnnouncement(adminId: string, title: string, content: string) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      const { data, error } = await supabase.rpc('admin_add_announcement', {
        p_admin_id: adminId,
        p_title: title,
        p_content: content,
      })
      clearTimeout(timeout)
      if (error) throw error
      return data
    } catch (e) {
      clearTimeout(timeout)
      console.error('Admin add announcement failed:', e)
      return null
    }
  },

  async adminGetAllTasks(adminId: string) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      const { data, error } = await supabase.rpc('admin_get_all_tasks', {
        p_admin_id: adminId,
      })
      clearTimeout(timeout)
      if (error) throw error
      return data
    } catch (e) {
      clearTimeout(timeout)
      console.error('Admin get tasks failed:', e)
      return null
    }
  },

  async adminGetAllAnnouncements(adminId: string) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      const { data, error } = await supabase.rpc('admin_get_all_announcements', {
        p_admin_id: adminId,
      })
      clearTimeout(timeout)
      if (error) throw error
      return data
    } catch (e) {
      clearTimeout(timeout)
      console.error('Admin get announcements failed:', e)
      return null
    }
  },

  async adminDeleteAnnouncement(adminId: string, announcementId: number) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      const { data, error } = await supabase.rpc('admin_delete_announcement', {
        p_admin_id: adminId,
        p_announcement_id: announcementId,
      })
      clearTimeout(timeout)
      if (error) throw error
      return data
    } catch (e) {
      clearTimeout(timeout)
      console.error('Admin delete announcement failed:', e)
      return null
    }
  },

  async adminDeleteTask(adminId: string, taskId: number) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      const { data, error } = await supabase.rpc('admin_delete_task', {
        p_admin_id: adminId,
        p_task_id: taskId,
      })
      clearTimeout(timeout)
      if (error) throw error
      return data
    } catch (e) {
      clearTimeout(timeout)
      console.error('Admin delete task failed:', e)
      return null
    }
  },

  async adminGetAllUsers(adminId: string, search: string = '', page: number = 1, pageSize: number = 50) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      const { data, error } = await supabase.rpc('admin_get_all_users', {
        p_admin_id: adminId,
        p_search: search,
        p_page: page,
        p_page_size: pageSize,
      })
      clearTimeout(timeout)
      if (error) throw error
      return data
    } catch (e) {
      clearTimeout(timeout)
      console.error('Admin get users failed:', e)
      return null
    }
  }
}