import React, { useState, useEffect } from 'react';
import { haptic, darkMode } from '../utils/animations';
import { DataService } from '../services/data';

interface LeaderboardEntry {
  username: string;
  full_name: string;
  balance: number;
  referral_count: number;
  user_rank: number;
}

const ProfilePage: React.FC = () => {
  const [profileData] = useState({
    name: 'John Doe',
    wallet: '0x1234...5678',
    joinDate: 'January 2024',
    avatar: '👤',
    level: 12,
    experience: 2450,
    nextLevelExp: 3000,
    title: 'Productivity Master'
  });

  const [_, setIsDarkMode] = useState(darkMode.get());
  const [isLoaded, setIsLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const walletConnected = true;
  const [tgUser, setTgUser] = useState<{ photo_url?: string; first_name?: string; last_name?: string } | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'referrals' | 'leaderboard'>('referrals');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const referrals = [
    { id: 1, name: 'Alice Smith', date: '2024-02-15', reward: 100 },
    { id: 2, name: 'Bob Johnson', date: '2024-02-18', reward: 100 },
    { id: 3, name: 'Carol Williams', date: '2024-02-20', reward: 100 },
    { id: 4, name: 'David Brown', date: '2024-02-22', reward: 100 },
    { id: 5, name: 'Eva Martinez', date: '2024-02-25', reward: 100 },
  ];

  const totalReferrals = referrals.length;
  // const totalEarned = totalReferrals * 500;
  const referralLink = 'https://smt-claim.com/ref/user123';

  useEffect(() => {
    setIsDarkMode(darkMode.get());
    setTimeout(() => setIsLoaded(true), 100);

    const tg = (window as any).Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user) {
      setTgUser(tg.initDataUnsafe.user);
    }

    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const data = await DataService.getLeaderboard(50);
      setLeaderboard(data || []);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }
  };

  const experiencePercentage = (profileData.experience / profileData.nextLevelExp) * 100;

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

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="w-full max-w-md md:max-w-2xl lg:max-w-3xl mx-auto px-4 pb-8 pt-6">
        
        {/* Premium Profile Header */}
        <div className={`mb-6 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className={`relative p-6 rounded-3xl bg-gray-900 border border-gray-800 shadow-2xl overflow-hidden`}>
            {/* Glow effect */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl"></div>
            
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
                      {profileData.name}
                    </h2>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-600 to-blue-500 text-white">
                      Level {profileData.level}
                    </span>
                    <span className="text-sm text-gray-400">
                      {profileData.title}
                    </span>
                  </div>
                  
                  {walletConnected ? (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                        </svg>
                      </div>
                      <p className="text-sm text-gray-400">
                        TON Wallet
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Experience Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Experience</span>
                  <span className="font-medium text-gray-300">
                    {profileData.experience} / {profileData.nextLevelExp} XP
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${experiencePercentage}%` }}
                  />
                </div>
              </div>

              <button
                id="edit-profile-btn"
                onClick={() => { haptic.light(); setShowVerificationModal(true); }}
                className="w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 bg-blue-600 text-white shadow-lg hover:shadow-xl"
              >
                Complete Verification
              </button>
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
                      <span className="text-sm text-gray-300">Earn per referral</span>
                      <span className="text-lg font-bold text-blue-400">100 $SMT</span>
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
                    {referrals.map((referral) => (
                      <div 
                        key={referral.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-800/30 border border-gray-700/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-lg">
                            {referral.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-white text-sm">{referral.name}</div>
                            <div className="text-xs text-gray-500">{referral.date}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-green-400">+{referral.reward}</div>
                          <div className="text-xs text-gray-500">$SMT</div>
                        </div>
                      </div>
                    ))}
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
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowVerificationModal(false)}></div>
            <div className="relative w-full max-w-sm bg-gray-900 rounded-3xl border border-gray-800 shadow-2xl overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-center mb-6">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
                    </svg>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-white text-center mb-2">Complete Verification</h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-xl">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-white">1</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">Send 0.1 TON</div>
                      <div className="text-xs text-gray-400">to the treasury wallet</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-xl">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-white">2</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">Wait for confirmation</div>
                      <div className="text-xs text-gray-400">Transaction verification</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-xl">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-white">3</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">Get Verified</div>
                      <div className="text-xs text-gray-400">Unlock all features</div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-gray-800 rounded-xl mb-4">
                  <div className="text-xs text-gray-400 mb-1">Treasury Wallet</div>
                  <div className="text-sm text-white font-mono break-all">EQC...xxx</div>
                </div>
                
                <button
                  onClick={() => { haptic.medium(); setShowVerificationModal(false); }}
                  className="w-full py-3 px-4 rounded-xl font-medium bg-blue-600 text-white shadow-lg hover:bg-blue-500 transition-all duration-200"
                >
                  Proceed to Pay 0.1 TON
                </button>
                
                <button
                  onClick={() => setShowVerificationModal(false)}
                  className="w-full py-2 mt-2 text-sm text-gray-400 hover:text-white transition-colors"
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