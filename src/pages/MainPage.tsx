import React, { useState, useEffect } from 'react';
import TaskPage from '../components/TaskPage.tsx';
import HomePage from '../components/HomePage.tsx';
import ProfilePage from '../components/ProfilePage.tsx';
import { haptic, particles } from '../utils/animations';

const MainPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'task' | 'home' | 'profile'>('home');
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    
  }, []);

  const tabs = [
    { id: 'task', label: 'Task', icon: '📋', color: 'from-blue-500 to-blue-600' },
    { id: 'home', label: 'Home', icon: '🏠', color: 'from-blue-500 to-blue-600' },
    { id: 'profile', label: 'Profile', icon: '👤', color: 'from-blue-500 to-blue-600' }
  ];

  const handleTabChange = (tabId: typeof activeTab) => {
    if (tabId === activeTab) return;
    
    setIsTransitioning(true);
    haptic.medium();
    
    // Create particle effect at tab position
    const tabElement = document.getElementById(`tab-${tabId}`);
    if (tabElement) {
      const rect = tabElement.getBoundingClientRect();
      particles.burst(rect.left + rect.width / 2, rect.top, 6);
    }
    
    setTimeout(() => {
      setActiveTab(tabId);
      setIsTransitioning(false);
      }, 150);
  };

  const renderContent = () => {
    const contentClass = `transition-all duration-300 ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`;
    
    switch (activeTab) {
      case 'task':
        return <div className={contentClass}><TaskPage /></div>;
      case 'home':
        return <div className={contentClass}><HomePage /></div>;
      case 'profile':
        return <div className={contentClass}><ProfilePage /></div>;
      default:
        return <div className={contentClass}><HomePage /></div>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      {/* Main Content */}
      <div className="flex-1 pb-20">
        {renderContent()}
      </div>

      {/* Premium Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 backdrop-blur-xl bg-gray-900/95 border-t border-gray-800">
        <div className="flex justify-around items-center py-2 sm:py-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => handleTabChange(tab.id as typeof activeTab)}
                className={`relative flex flex-col items-center justify-center py-1 sm:py-2 px-2 sm:px-3 rounded-xl sm:rounded-2xl transition-all duration-300 transform flex-1 max-w-[100px] ${
                  activeTab === tab.id
                    ? 'scale-105 sm:scale-110'
                    : 'scale-100 hover:scale-105'
                }`}
              >
                {/* Active tab background */}
                {activeTab === tab.id && (
                  <div className={`absolute inset-0 bg-gradient-to-br ${tab.color} opacity-20 rounded-xl sm:rounded-2xl animate-pulse`} />
                )}
                
                {/* Icon container */}
                <div className={`relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg sm:rounded-xl transition-all duration-300 ${
                  activeTab === tab.id
                    ? `bg-gradient-to-br ${tab.color} text-white shadow-lg`
                    : 'bg-gray-800 text-gray-400'
                }`}>
                  <span className={`text-lg sm:text-xl transition-transform duration-300 ${
                    activeTab === tab.id ? 'scale-110' : 'scale-100'
                  }`}>
                    {tab.icon}
</span>
                </div>
                
                {/* Label */}
                <span className={`text-xs font-medium mt-0.5 sm:mt-1 transition-colors duration-300 ${
                  activeTab === tab.id
                    ? 'text-white'
                    : 'text-gray-400'
                }`}>
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        
        .animate-ping {
          animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}} />
    </div>
  );
};

export default MainPage;
