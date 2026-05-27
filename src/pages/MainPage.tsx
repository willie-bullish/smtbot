import React, { useState, useRef, useLayoutEffect } from 'react';
import TaskPage from '../components/TaskPage';
import HomePage from '../components/HomePage';
import ProfilePage from '../components/ProfilePage';
import { haptic } from '../utils/animations';

const MainPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'task' | 'home' | 'profile'>('home');
  const scrollRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
    window.scrollTo(0, 0);
  }, [activeTab]);

  const tabs = [
    { id: 'task', label: 'Task', icon: '📋', color: 'from-blue-500 to-blue-600' },
    { id: 'home', label: 'Home', icon: '🏠', color: 'from-blue-500 to-blue-600' },
    { id: 'profile', label: 'Profile', icon: '👤', color: 'from-blue-500 to-blue-600' }
  ];

  const handleTabChange = (tabId: typeof activeTab) => {
    if (tabId === activeTab) return;
    haptic.medium();
    setActiveTab(tabId);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'task':
        return <TaskPage />;
      case 'home':
        return <HomePage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-950 overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto pb-20 min-h-0">
        {renderContent()}
      </div>

      <div className="fixed bottom-0 left-0 right-0 backdrop-blur-xl bg-gray-900/95 border-t border-gray-800">
        <div className="flex justify-around items-center py-2 sm:py-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => handleTabChange(tab.id as typeof activeTab)}
              className={`relative flex flex-col items-center justify-center py-1 sm:py-2 px-2 sm:px-3 rounded-xl sm:rounded-2xl transition-all duration-300 transform flex-1 max-w-[100px] ${
                activeTab === tab.id ? 'scale-105 sm:scale-110' : 'scale-100 hover:scale-105'
              }`}
            >
              {activeTab === tab.id && (
                <div className={`absolute inset-0 bg-gradient-to-br ${tab.color} opacity-20 rounded-xl sm:rounded-2xl animate-pulse`} />
              )}
              
              <div className={`relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg sm:rounded-xl transition-all duration-300 ${
                activeTab === tab.id ? `bg-gradient-to-br ${tab.color} text-white shadow-lg` : 'bg-gray-800 text-gray-400'
              }`}>
                <span className={`text-lg sm:text-xl transition-transform duration-300 ${
                  activeTab === tab.id ? 'scale-110' : 'scale-100'
                }`}>
                  {tab.icon}
                </span>
              </div>
              
              <span className={`text-xs font-medium mt-0.5 sm:mt-1 transition-colors duration-300 ${
                activeTab === tab.id ? 'text-white' : 'text-gray-400'
              }`}>
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MainPage;