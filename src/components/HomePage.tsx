import React, { useState, useEffect } from 'react'
import { haptic } from '../utils/animations'
import { DataService } from '../services/data'
import { useAuth } from '../hooks/useAuth'

interface LeaderboardEntry {
  username: string
  full_name: string
  balance: number
  referral_count: number
  user_rank: number
}

const HomePage: React.FC = () => {
  const { user, loading: authLoading } = useAuth()
  const [isLoaded, setIsLoaded] = useState(false)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    try {
      setLoading(true)
      const leaderboardData = await DataService.getLeaderboard(10)
      setLeaderboard(leaderboardData || [])
      setIsLoaded(true)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load data:', error)
      setIsLoaded(true)
      setLoading(false)
    }
  }

  const totalSupply = 1000000000
  const claimedAmount = 145000000
  const claimProgress = (claimedAmount / totalSupply) * 100

  const getUserDisplayName = () => {
    if (!user) return 'Guest'
    return user.full_name || user.username || 'User'
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="w-full max-w-md mx-auto px-4 pb-24 pt-6">
        
        {/* Header */}
        <div className={`transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-3xl font-medium text-blue-400 mb-1">
                Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}
              </p>
              <p className="text-gray-400 text-sm">@{user?.username || 'guest'}</p>
            </div>
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <span className="text-2xl">👤</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-3 border-gray-900 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Balance Card */}
        <div className={`mb-6 transition-all duration-700 delay-100 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl shadow-blue-900/10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-400">Total Balance</span>
                <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-full">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-xs font-medium text-green-600">Live</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-black text-white">{user?.balance?.toLocaleString() || 0}</span>
                <span className="text-lg font-bold text-blue-400">SMT</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-green-600">{user?.referral_count || 0} referrals</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cylindrical Progress Bar */}
        <div className={`mb-6 transition-all duration-700 delay-150 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="relative p-6 rounded-3xl bg-gray-900 border border-gray-800 shadow-2xl shadow-blue-900/20">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-600/10 via-transparent to-transparent"></div>
            
            <div className="relative flex items-center justify-center gap-10">
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-t from-blue-500/30 to-transparent rounded-full blur-xl"></div>
                
                <div className="relative w-20 h-48 bg-gray-950 rounded-full overflow-hidden border-4 border-gray-700 shadow-2xl">
                  <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]"></div>
                  <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900"></div>
                  <div className="absolute inset-0 opacity-30">
                    <div className="w-full h-full" style={{
                      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 11px)'
                    }}></div>
                  </div>
                  <div 
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-700 via-blue-500 to-blue-400 transition-all duration-1000 ease-out"
                    style={{ height: `${claimProgress}%` }}
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-4 bg-blue-400/50 rounded-full blur-md"></div>
                    <div className="absolute bottom-2 left-1/4 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
                    <div className="absolute bottom-8 left-1/3 w-1.5 h-1.5 bg-white/20 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                  </div>
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-14 h-3 bg-gray-700 rounded-full"></div>
                  <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-gray-600 rounded-full"></div>
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-4 bg-white/5 rounded-full"></div>
                </div>
              </div>
              
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-blue-400">SMT Distribution Progress</span>
                </div>
                <div className="text-3xl font-black text-white tracking-tight">{claimedAmount.toLocaleString()}</div>
                <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                  <span>of</span>
                  <span className="font-semibold">{totalSupply.toLocaleString()}</span>
                </div>
                <div className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl shadow-lg shadow-blue-500/30">
                  <span className="text-sm font-bold text-white">{claimProgress.toFixed(1)}% reserved</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className={`flex items-center gap-4 mb-6 transition-all duration-700 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
          <span className="text-xs text-gray-500 uppercase tracking-widest">Leaderboard</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
        </div>

        {/* Leaderboard */}
        <div className={`transition-all duration-700 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="space-y-2">
            {leaderboard.length > 0 ? (
              leaderboard.map((entry, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-xl ${
                    idx < 3 ? 'bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700' : 'bg-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      idx === 0 ? 'bg-yellow-500 text-black' :
                      idx === 1 ? 'bg-gray-400 text-black' :
                      idx === 2 ? 'bg-amber-600 text-white' :
                      'bg-gray-700 text-gray-300'
                    }`}>
                      {entry.user_rank}
                    </div>
                    <div>
                      <p className="font-medium text-white">{entry.username || entry.full_name}</p>
                      <p className="text-xs text-gray-500">{entry.referral_count} referrals</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-400">{entry.balance.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">SMT</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No leaderboard data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Premium Banner */}
        <div className={`mt-6 p-5 rounded-3xl bg-blue-600 relative overflow-hidden transition-all duration-700 delay-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold text-lg mb-1">Unlock Premium</h3>
              <p className="text-white/80 text-sm">Get 2x rewards & exclusive perks</p>
            </div>
            <button 
              onClick={() => { haptic.medium(); }}
              className="px-5 py-2.5 bg-white text-blue-600 font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              Upgrade
            </button>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }
      `}} />
    </div>
  )
}

export default HomePage