import React, { useState, useEffect } from 'react';
import { haptic, particles, darkMode } from '../utils/animations';

interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  total?: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: Date;
}

const AchievementPage: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: 1,
      title: 'First Task',
      description: 'Complete your first task',
      icon: '🎯',
      unlocked: true,
      rarity: 'common',
      unlockedAt: new Date(Date.now() - 86400000 * 5)
    },
    {
      id: 2,
      title: 'Task Master',
      description: 'Complete 10 tasks',
      icon: '🏆',
      unlocked: true,
      rarity: 'rare',
      unlockedAt: new Date(Date.now() - 86400000 * 3)
    },
    {
      id: 3,
      title: 'Streak Champion',
      description: 'Maintain a 7-day streak',
      icon: '🔥',
      unlocked: true,
      rarity: 'epic',
      unlockedAt: new Date(Date.now() - 86400000)
    },
    {
      id: 4,
      title: 'Productivity Pro',
      description: 'Complete 25 tasks',
      icon: '⭐',
      unlocked: false,
      progress: 12,
      total: 25,
      rarity: 'epic'
    },
    {
      id: 5,
      title: 'Consistency King',
      description: 'Use the app for 30 days',
      icon: '👑',
      unlocked: false,
      progress: 5,
      total: 30,
      rarity: 'legendary'
    },
    {
      id: 6,
      title: 'Speed Demon',
      description: 'Complete 5 tasks in one day',
      icon: '⚡',
      unlocked: false,
      progress: 3,
      total: 5,
      rarity: 'rare'
    },
    {
      id: 7,
      title: 'Early Bird',
      description: 'Complete a task before 9 AM',
      icon: '🌅',
      unlocked: false,
      progress: 2,
      total: 5,
      rarity: 'common'
    },
    {
      id: 8,
      title: 'Night Owl',
      description: 'Complete a task after 9 PM',
      icon: '🦉',
      unlocked: false,
      progress: 1,
      total: 5,
      rarity: 'common'
    }
  ]);
  const [selectedAchievement, setSelectedAchievement] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState<number | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(darkMode.get());

  useEffect(() => {
    setIsDarkMode(darkMode.get());
  }, []);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'from-gray-400 to-gray-600';
      case 'rare': return 'from-blue-400 to-blue-600';
      case 'epic': return 'from-blue-400 to-blue-600';
      case 'legendary': return 'from-yellow-400 to-orange-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getRarityBgColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return isDarkMode ? 'bg-gray-800' : 'bg-gray-100';
      case 'rare': return isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50';
      case 'epic': return isDarkMode ? 'bg-purple-900/30' : 'bg-purple-50';
      case 'legendary': return isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-50';
      default: return isDarkMode ? 'bg-gray-800' : 'bg-gray-100';
    }
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  const handleAchievementClick = (achievement: Achievement) => {
    setSelectedAchievement(achievement.id);
    haptic.light();
    
    if (achievement.unlocked) {
      const rect = document.getElementById(`achievement-${achievement.id}`)?.getBoundingClientRect();
      if (rect) {
        particles.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 4, ['✨', '⭐', '🌟']);
      }
    }
  };

  const simulateUnlock = (id: number) => {
    setIsAnimating(id);
    haptic.heavy();
    
    const rect = document.getElementById(`achievement-${id}`)?.getBoundingClientRect();
    if (rect) {
      particles.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 12, ['🎉', '🎊', '✨', '⭐', '🌟', '🏆', '👑']);
    }
    
    setTimeout(() => {
      setAchievements(prev => prev.map(a => 
        a.id === id ? { ...a, unlocked: true, unlockedAt: new Date() } : a
      ));
      setIsAnimating(null);
    }, 1000);
  };

  return (
    <div className={`p-4 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-md mx-auto space-y-6">
        {/* Premium Header */}
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-blue-600">
                Achievements
              </h1>
              <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Unlock rewards and showcase your progress
              </p>
            </div>
            <div className="text-4xl animate-bounce-slow">🏆</div>
          </div>

          {/* Progress Overview */}
          <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Collection Progress
              </span>
              <span className={`text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                {unlockedCount} / {totalCount}
              </span>
            </div>
            <div className={`w-full h-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden mb-2`}>
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
              />
            </div>
            <div className="flex justify-between">
              <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                {Math.round((unlockedCount / totalCount) * 100)}% Complete
              </span>
              <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                {totalCount - unlockedCount} remaining
              </span>
            </div>
          </div>
        </div>

        {/* Rarity Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Unlocked', value: unlockedCount, icon: '🏆', color: 'from-blue-500 to-blue-600' },
            { label: 'In Progress', value: achievements.filter(a => !a.unlocked && a.progress !== undefined).length, icon: '⏳', color: 'from-blue-500 to-blue-600' }
          ].map((stat, index) => (
            <div
              key={index}
              className={`p-4 rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg animate-slide-up`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-2`}>
                <span className="text-xl">{stat.icon}</span>
              </div>
              <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stat.value}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Achievement Grid */}
        <div className="space-y-4">
          {achievements.map((achievement, index) => (
            <div
              key={achievement.id}
              id={`achievement-${achievement.id}`}
              onClick={() => handleAchievementClick(achievement)}
              className={`relative p-4 rounded-2xl shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-[1.02] ${
                isAnimating === achievement.id ? 'scale-95 opacity-50' : 'scale-100 opacity-100'
              } ${getRarityBgColor(achievement.rarity)} ${
                selectedAchievement === achievement.id ? 'ring-2 ring-purple-500' : ''
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Rarity indicator */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-gradient-to-b ${getRarityColor(achievement.rarity)}`} />
              
              <div className="flex items-start">
                <div className={`text-4xl mr-4 transition-all duration-300 ${
                  achievement.unlocked ? 'scale-110' : 'scale-100 opacity-50'
                } ${selectedAchievement === achievement.id ? 'animate-bounce' : ''}`}>
                  {achievement.icon}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className={`font-bold text-lg ${
                        achievement.unlocked 
                          ? isDarkMode ? 'text-gray-100' : 'text-gray-800'
                          : isDarkMode ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        {achievement.title}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded-full bg-gradient-to-r ${getRarityColor(achievement.rarity)} text-white font-medium`}>
                        {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
                      </span>
                    </div>
                    {achievement.unlocked && (
                      <div className="flex items-center">
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-medium">
                          ✓ Unlocked
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <p className={`text-sm mb-3 ${
                    achievement.unlocked 
                      ? isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      : isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {achievement.description}
                  </p>
                  
                  {/* Progress Bar for Incomplete Achievements */}
                  {!achievement.unlocked && achievement.progress !== undefined && achievement.total !== undefined && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Progress</span>
                        <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {achievement.progress}/{achievement.total}
                        </span>
                      </div>
                      <div className={`w-full h-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                        <div 
className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${(achievement.progress / achievement.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Unlocked date */}
                  {achievement.unlocked && achievement.unlockedAt && (
                    <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      Unlocked on {achievement.unlockedAt.toLocaleDateString()}
                    </div>
                  )}
                  
                  {/* Simulate unlock button for demo */}
                  {!achievement.unlocked && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        simulateUnlock(achievement.id);
                      }}
                      className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded-full font-medium hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                    >
                      Unlock for Demo
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Motivational Message */}
        <div className={`text-center p-6 rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <div className="text-5xl mb-3 animate-bounce-slow">
            {unlockedCount === totalCount ? '🎊' : '🎯'}
          </div>
          <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
            {unlockedCount === totalCount ? 'Legendary Achievement!' : 'Keep Grinding!'}
          </h3>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {unlockedCount === totalCount
              ? "You've unlocked every achievement! You're a true productivity master!"
              : `${totalCount - unlockedCount} achievements remaining. You've got this!`
            }
          </p>
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
          
          @keyframes bounce-slow {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
          }
          
          .animate-fade-in {
            animation: fade-in 0.6s ease-out;
          }
          
          .animate-slide-up {
            animation: slide-up 0.6s ease-out;
            animation-fill-mode: both;
          }
          
          .animate-bounce-slow {
            animation: bounce-slow 2s ease-in-out infinite;
          }
          
          .animate-bounce {
            animation: bounce 0.5s ease-in-out;
          }
        `}} />
      </div>
    </div>
  );
};

export default AchievementPage;
