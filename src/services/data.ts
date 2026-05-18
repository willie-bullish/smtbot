import { supabase } from '../utils/supabase'

export const DataService = {
  async getLeaderboard(limit = 100) {
    const { data, error } = await supabase.rpc('get_public_leaderboard', {
      p_limit: limit,
      p_offset: 0
    })
    if (error) throw error
    return data
  },

  async getUserRank(userId: string) {
    const { data, error } = await supabase.rpc('get_user_rank', {
      p_user_id: userId
    })
    if (error) throw error
    return data
  },

  async getTasks() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data
  },

  async getUserTaskCompletions(userId: string) {
    const { data, error } = await supabase
      .from('task_completions')
      .select('task_id, verified, completed_at')
      .eq('user_id', userId)
    if (error) throw error
    return data
  },

  async completeTask(userId: string, taskId: number) {
    const { error } = await supabase.from('task_completions').insert({
      user_id: userId,
      task_id: taskId
    })
    if (error && error.code !== '23505') throw error
    return true
  },

  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) throw error
    return data
  },

  async verifyTask(userId: string, taskId: number, verified: boolean = true) {
    const { data, error } = await supabase
      .from('task_completions')
      .update({ verified: verified })
      .eq('user_id', userId)
      .eq('task_id', taskId)
      .select()
      .single()
    if (error) throw error
    return data
  }
}