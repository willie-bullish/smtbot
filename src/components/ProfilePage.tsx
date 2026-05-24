import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { haptic, darkMode } from '../utils/animations';
import { DataService } from '../services/data';
import { useAuthContext } from '../contexts/AuthContext';
import { toUserFriendlyAddress } from '@tonconnect/sdk';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';

interface LeaderboardEntry {
  username: string;
  full_name: string;
  balance: number;
  referral_count: number;
  user_rank: number;
}

const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuthContext();
  const navigate = useNavigate();
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet() as any;
  const [profileData] = useState({
    avatar: '👤',
  });

  const [_, setIsDarkMode] = useState(darkMode.get());
  const [isLoaded, setIsLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const walletConnected = true;
  const displayWalletAddress = user?.wallet_address
    ? (() => {
        const friendly = user.wallet_address.startsWith('0:')
          ? toUserFriendlyAddress(user.wallet_address, false)
          : user.wallet_address;
        return friendly.slice(0, 4) + '***' + friendly.slice(-4);
      })()
    : '';
  const [tgUser, setTgUser] = useState<{ photo_url?: string; first_name?: string; last_name?: string } | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'referrals' | 'leaderboard'>('referrals');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [referrals, setReferrals] = useState<{ id: string; username: string | null; full_name: string | null; created_at: string }[]>([]);
  const [referralRewards, setReferralRewards] = useState<{ id: number; referred_user_id: string; reward_amount: number; created_at: string }[]>([]);
  const [referralsLoading, setReferralsLoading] = useState(false);
  
  const totalReferrals = user?.referral_count ?? 0;
  const referralLink = user ? `https://t.me/smtdroptest_bot/app?startapp=${user.telegram_id}` : '';
  
  useEffect(() => {
    setIsDarkMode(darkMode.get());
    setTimeout(() => setIsLoaded(true), 100);
    
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user) {
      setTgUser(tg.initDataUnsafe.user);
    }
    
    loadLeaderboard();
    if (user) loadReferrals();
  }, [user]);

  const loadReferrals = async () => {
    if (!user) return;
    setReferralsLoading(true);
    try {
      const [data, rewards] = await Promise.all([
        DataService.getUserReferrals(user.id),
        DataService.getUserReferralRewards(user.id)
      ]);
      setReferrals(data || []);
      setReferralRewards(rewards || []);
    } catch (error) {
      console.error('Failed to load referrals:', error);
    } finally {
      setReferralsLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const data = await DataService.getLeaderboard(50);
      setLeaderboard(data || []);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    haptic.success();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join me on SMT',
        text: 'Use my referral link to claim your tokens!',
        url: referralLink
      });
    } else {
      handleCopyLink();
    }
  };

  const handleVerify = async () => {
    if (!user) return;

    if (!wallet) {
      tonConnectUI.openModal();
      return;
    }

    try {
      const tx = {
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [{
          address: "UQB-gTuxivCZUh8lLdQmDawPJw1e-4JIGhPPgn3Y-dqMUZLI",
          amount: "100000000",
        }],
      };
      const result = await tonConnectUI.sendTransaction(tx);
      const friendlyWallet = wallet?.account?.address
        ? toUserFriendlyAddress(wallet.account.address, true)
        : undefined;
      const ok = await DataService.verifyPayment(user.id, 'ton', result?.boc, 'verify', friendlyWallet);
      if (ok) {
        haptic.success();
        await refreshUser();
        return;
      }
    } catch (e) {
      console.error('TON failed, falling back to Stars:', e);
    }

    try {
      const url = await DataService.createStarsInvoice(user.id, 'verify');
      if (!url) return;

      const tg = (window as any).Telegram?.WebApp;
      if (!tg?.openInvoice) return;

      tg.openInvoice(url, async (status: string) => {
        if (status === 'paid') {
          const ok = await DataService.verifyPayment(user.id, 'stars', undefined, 'verify');
          if (ok) {
            haptic.success();
            await refreshUser();
          }
        }
      });
    } catch {}
  };

  return (
    <div className="min-h-full bg-gray-950">
      <div className="w-full max-w-md md:max-w-2xl lg:max-w-3xl mx-auto px-4 pb-8 pt-6">
        
        {/* Premium Profile Header */}
        <div className={`mb-6 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className={`relative p-6 rounded-3xl bg-gray-900 border border-gray-800 shadow-2xl overflow-hidden`}>
            {/* Glow effect */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl"></div>

            {user?.is_admin && (
              <button
                onClick={() => navigate('/admin')}
                className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/20 text-xs font-medium text-green-600 hover:bg-green-500/30 transition-all"
              >
                ADMIN
              </button>
            )}
            
            <div className="relative">
              <div className="flex items-center mb-6">
                <div className="relative">
                  {tgUser?.photo_url ? (
                    <img 
                      src={tgUser.photo_url} 
                      alt="Profile" 
                      className="w-20 h-20 rounded-2xl object-cover mr-4 shadow-lg shadow-blue-500/30"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center text-4xl mr-4 shadow-lg shadow-blue-500/30">
                      {profileData.avatar}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                    <h2 className="text-xl font-bold text-white">
                      {user?.full_name || user?.username || 'User'}
                    </h2>
                  
                  <div className="flex items-center gap-2 mb-2">
                    {(user as any)?.is_verified ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-green-500 to-green-600 text-white">
                        Verified
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-600 to-blue-500 text-white">
                        Not-Verified
                      </span>
                    )}
                    {(user as any)?.is_premium && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-green-500 to-green-600 text-white">
                        Premium
                      </span>
                    )}
                  </div>
                  
                  {walletConnected ? (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                        </svg>
                      </div>
                      <p className="text-sm text-gray-400 font-mono">
                        {displayWalletAddress}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>

              {(user as any)?.is_verified ? (
                <button
                  className="w-full py-3 px-4 rounded-xl font-medium bg-gray-700 text-gray-400 cursor-not-allowed transition-all duration-200"
                  disabled
                >
                  Already Verified
                </button>
              ) : (
                <button
                  onClick={() => { haptic.light(); setShowVerificationModal(true); }}
                  className="w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 bg-blue-600 text-white shadow-lg hover:shadow-xl"
                >
                  Complete Verification
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className={`mb-4 transition-all duration-700 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex gap-2 p-1 bg-gray-900 rounded-xl border border-gray-800">
            <button
              onClick={() => { setActiveTab('referrals'); haptic.light(); }}
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'referrals'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <span>👥</span>
              <span>Referrals</span>
            </button>
            <button
              onClick={() => { setActiveTab('leaderboard'); haptic.light(); }}
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'leaderboard'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <span>🏆</span>
              <span>Leaderboard</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className={`mb-6 transition-all duration-700 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {activeTab === 'referrals' ? (
            <>
              {/* Referral Stats */}
              <div className="relative p-6 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-900 border border-gray-800 shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
                
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">👥</span>
                      <h3 className="text-lg font-bold text-white">Referrals</h3>
                    </div>
                    <div className="px-3 py-1 bg-blue-600/20 rounded-full">
                      <span className="text-xs font-medium text-blue-400">{totalReferrals} Referrals</span>
                    </div>
                  </div>

                  {/* Earn per referral and Share/Copy */}
                  <div className="mb-4 p-3 rounded-xl bg-blue-600/10 border border-blue-600/20">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-300">Earned from referrals</span>
                      <span className="text-lg font-bold text-blue-400">{referralRewards.reduce((sum, r) => sum + r.reward_amount, 0)} $SMT</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 overflow-hidden">
                        <span className="text-xs text-gray-400 truncate block">{referralLink}</span>
                      </div>
                      <button
                        onClick={handleCopyLink}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${copied ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
                      >
                        {copied ? '✓ Copied' : 'Copy'}
                      </button>
                      <button
                        onClick={handleShare}
                        className="px-4 py-2 rounded-lg font-medium text-sm bg-gray-700 text-white hover:bg-gray-600 transition-all duration-200"
                      >
                        Share
                      </button>
                    </div>
                  </div>

                  {/* Referral List */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-400 mb-3">Recent Referrals</div>
                    {referralsLoading ? (
                      <div className="space-y-2">
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
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3 rounded-xl bg-gray-800/30 border border-gray-700/50"
                          >
                            <div className="flex items-center gap-3">
                              <div className="skeleton-shimmer w-10 h-10 rounded-full flex-shrink-0" style={{ animationDelay: `${i * 0.08}s` }} />
                              <div className="flex flex-col gap-2">
                                <div className="skeleton-shimmer w-28 h-4 rounded-lg" style={{ animationDelay: `${i * 0.08}s` }} />
                                <div className="skeleton-shimmer w-20 h-3 rounded-lg" style={{ animationDelay: `${i * 0.08}s` }} />
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <div className="skeleton-shimmer w-12 h-4 rounded-lg" style={{ animationDelay: `${i * 0.08}s` }} />
                              <div className="skeleton-shimmer w-8 h-3 rounded-lg" style={{ animationDelay: `${i * 0.08}s` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : referrals.length > 0 ? (
                      referrals.map((referral) => {
                        const reward = referralRewards.find(r => r.referred_user_id === referral.id);
                        return (
                        <div 
                          key={referral.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-gray-800/30 border border-gray-700/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-lg">
                              {(referral.full_name || referral.username || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-white text-sm">{referral.full_name || referral.username || 'User'}</div>
                              <div className="text-xs text-gray-500">{new Date(referral.created_at).toLocaleDateString()}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-green-400">+{reward?.reward_amount || 100}</div>
                            <div className="text-xs text-gray-500">$SMT</div>
                          </div>
                        </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-6 px-4">
                        <div className="text-3xl mb-2">🔗</div>
                        <p className="text-gray-400 text-sm mb-3">No referrals yet</p>
                        <p className="text-gray-500 text-xs">Copy your link and invite friends to earn 100 $SMT per referral!</p>
                        <p className="text-gray-500 text-xs mt-2">Rewards are automatically credited when friends join via your link.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              {leaderboard.length > 0 ? (
                leaderboard.map((entry, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-xl ${
                      entry.user_rank <= 3
                        ? 'bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700'
                        : 'bg-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        entry.user_rank === 1 ? 'bg-yellow-500 text-black' :
                        entry.user_rank === 2 ? 'bg-gray-400 text-black' :
                        entry.user_rank === 3 ? 'bg-amber-600 text-white' :
                        'bg-gray-700 text-gray-300'
                      }`}>
                        {entry.user_rank}
                      </div>
                      <div>
                        <p className="font-medium text-white text-sm">{entry.username}</p>
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
                  <div className="text-4xl mb-2">🏆</div>
                  <p>No leaderboard data yet</p>
                </div>
              )}
            </div>
          )}
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes slide-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .animate-fade-in {
            animation: fade-in 0.6s ease-out;
          }
          
          .animate-slide-up {
            animation: slide-up 0.6s ease-out;
            animation-fill-mode: both;
          }
        `}} />

        {/* Verification Modal */}
        {showVerificationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowVerificationModal(false)}></div>
              <div className="relative w-full max-w-sm bg-gray-900 rounded-3xl border border-gray-800 shadow-2xl overflow-hidden">
              <div className="p-5">
                <div className="flex items-center justify-center mb-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                    </svg>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white text-center mb-3">Human Verification</h3>

                <div className="space-y-2 mb-4">
                  <div className="p-2.5 bg-gray-800/50 rounded-xl">
                    <div className="text-xs font-semibold text-white mb-0.5">Why is verification needed?</div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      To filter out bots and prevent malicious users from participating in the airdrop. We want only real users to benefit from the $SMT distribution.
                    </p>
                  </div>

                  <div className="p-2.5 bg-gray-800/50 rounded-xl">
                    <p className="text-xs text-gray-400 leading-relaxed">
                      All fees incurred during human verification will be fully refunded alongside the airdrop.
                    </p>
                  </div>

                  <div className="p-2.5 bg-gray-800/50 rounded-xl">
                    <p className="text-xs text-gray-400 leading-relaxed">
                      You will receive <span className="text-green-400 font-medium">5,000 $SMT</span> as a bonus for completing human verification.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => { setShowVerificationModal(false); handleVerify(); }}
                  className="w-full py-2.5 px-4 rounded-xl font-medium text-sm bg-blue-600 text-white shadow-lg hover:bg-blue-500 transition-all duration-200"
                >
                  Proceed to Verification
                </button>

                <button
                  onClick={() => setShowVerificationModal(false)}
                  className="w-full py-1.5 mt-1 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;