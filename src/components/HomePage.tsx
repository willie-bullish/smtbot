import React, { useState, useEffect } from 'react'
import { haptic } from '../utils/animations'
import { DataService } from '../services/data'
import { useAuthContext } from '../contexts/AuthContext'
import { TonConnectButton, useTonWallet } from '@tonconnect/ui-react'

interface Announcement {
  id: number
  title: string
  content: string
  created_at: string
}

const HomePage: React.FC = () => {
  const { user, loading: authLoading, refreshUser } = useAuthContext()
  const [isLoaded, setIsLoaded] = useState(false)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [tgUser, setTgUser] = useState<{ photo_url?: string; first_name?: string; last_name?: string } | null>(null)
  const wallet = useTonWallet() as any
  const walletAddress = wallet?.account?.address || wallet?.device?.address || (user as any)?.wallet_address || null
  const walletConnected = !!(wallet?.account?.address || wallet?.device?.address || walletAddress)

  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100)
    loadData()
    if (user) {
      refreshUser()
    }
    const tg = (window as any).Telegram?.WebApp
    if (tg?.initDataUnsafe?.user) {
      setTgUser(tg.initDataUnsafe.user)
    }
  }, [])

  useEffect(() => {
    const addr = wallet?.device?.address || wallet?.account?.address || (wallet as any)?.address
    if (addr && user && !(user as any)?.wallet_address) {
      console.log('Wallet connected for first time, saving address and crediting bonus')
      DataService.saveWalletAddress(user.id, addr).then(() => {
        console.log('Wallet saved, now crediting welcome bonus')
        DataService.creditWelcomeBonus(user.id).then(async (credited) => {
          console.log('Welcome bonus credited:', credited)
          if (credited) {
            haptic.success()
          }
          await refreshUser()
          console.log('User data refreshed, new balance should be visible')
        }).catch((err) => {
          console.error('Credit welcome bonus error:', err)
        })
      }).catch(console.error)
    } else if (addr && user && (user as any)?.wallet_address && (user as any)?.wallet_address !== addr) {
      DataService.saveWalletAddress(user.id, addr).then(() => {
        refreshUser()
      }).catch(console.error)
    }
  }, [wallet, user])

  const loadData = async () => {
    try {
      const data = await DataService.getAnnouncements()
      setAnnouncements(data || [])
    } catch (error) {
      console.error('Failed to load announcements:', error)
    }
  }

  const formatAddress = (address: string) => {
    if (!address) return ''
    return address.slice(0, 4) + '...' + address.slice(-4)
  }

  const totalSupply = 1000000000
  const claimedAmount = 145000000
  const claimProgress = (claimedAmount / totalSupply) * 100

  return (
  <div className="min-h-screen bg-gray-950">
      <div className="w-full max-w-md md:max-w-2xl lg:max-w-3xl mx-auto px-4 pb-8 pt-2">
        
        {/* Header */}
        <div className={`mb-6 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-2xl font-medium text-blue-400 mb-1">
                Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}
              </p>
            </div>
            <div className="relative">
              {walletConnected && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900 animate-pulse"></div>
              )}
              {tgUser?.photo_url ? (
                <img 
                  src={tgUser.photo_url} 
                  alt="Profile" 
                  className="w-10 h-10 rounded-2xl object-cover shadow-lg shadow-blue-500/30"
                />
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <span className="text-lg">👤</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Balance Card */}
        <div className={`mb-6 transition-all duration-700 delay-100 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl shadow-blue-900/10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative z-10">
              {authLoading || !isLoaded ? (
                <>
                  <style>{`
                    @keyframes skeleton-sweep {
                      0% { background-position: -200% 0; }
                      100% { background-position: 200% 0; }
                    }
                    .skeleton-shimmer {
                      background: linear-gradient(90deg, #1f2937 25%, #2d3748 50%, #1f2937 75%);
                      background-size: 200% 100%;
                      animation: skeleton-sweep 1.8s ease-in-out infinite;
                    }
                  `}</style>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-400">Total Balance</span>
                    <div className="skeleton-shimmer w-20 h-5 rounded-full" />
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="skeleton-shimmer w-36 h-10 rounded-lg inline-block align-middle" />
                    <span className="text-lg font-bold text-blue-400">SMT</span>
                  </div>
                  <div className="skeleton-shimmer w-28 h-4 rounded-lg" />
                </>
              ) : walletConnected ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-400">Total Balance</span>
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-full">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <span className="text-xs font-medium text-green-600">Connected</span>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl font-black text-white">{user?.balance?.toLocaleString() || 0}</span>
                    <span className="text-lg font-bold text-blue-400">SMT</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-mono">{formatAddress(walletAddress)}</span>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="text-lg font-bold text-white mb-2">Welcome Bonus</div>
                  <div className="text-4xl font-black text-blue-400 mb-4">1,000 $SMT</div>
                  <div className="text-sm text-gray-400 mb-4">Connect Wallet to Claim</div>
                  <div className="flex justify-center">
                    <TonConnectButton />
                  </div>
                </div>
              )}
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
        <div className={`mb-6 transition-all duration-700 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
            <span className="text-xs text-gray-500 uppercase tracking-widest">Announcements</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
        </div>

        {/* Announcements */}
        <div className={`transition-all duration-700 delay-250 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="space-y-3">
            {announcements.length > 0 ? (
              announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="p-4 rounded-xl bg-gray-900 border border-gray-800"
                >
                  <h3 className="font-bold text-white mb-1">{ann.title}</h3>
                  <p className="text-sm text-gray-400">{ann.content}</p>
                  <p className="text-xs text-gray-600 mt-2">
                    {new Date(ann.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No announcements yet</p>
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