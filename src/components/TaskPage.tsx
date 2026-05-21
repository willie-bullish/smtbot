import React, { useState, useEffect } from 'react';
import { haptic } from '../utils/animations';
import { DataService } from '../services/data';
import { useAuthContext } from '../contexts/AuthContext';
import { useToast } from './Toast';

interface Task {
  id: number
  title: string
  reward: string
  linkUrl: string
  completed: boolean
  verifying: boolean
  verifyType: 'auto' | 'manual' | 'referral' | 'telegram'
  telegramChatId?: string
  referralTarget?: number
}

const TaskPage: React.FC = () => {
  const { user, loading } = useAuthContext();
  const { showToast } = useToast();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [isLoaded, setIsLoaded] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [verifyingTaskId, setVerifyingTaskId] = useState<number | null>(null);

  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100);
    loadTasks();
  }, [user]);

  const loadTasks = async () => {
    if (!user) return;
    try {
      setTasksLoading(true);
      const dbTasks = await DataService.getTasks();
      const userCompletions = await DataService.getUserTaskCompletions(user.id);
      console.log('loadTasks: userCompletions:', userCompletions);

      if (dbTasks && dbTasks.length > 0) {
        const formattedTasks = dbTasks.map((task: any) => {
          const completion = userCompletions?.find((c: any) => c.task_id === task.id);
          console.log('Task', task.id, 'completion:', completion);
          return {
            id: task.id,
            title: task.title,
            reward: `${task.reward} SMT`,
            linkUrl: task.link_url || '#',
            completed: completion?.verified || false,
            verifying: completion ? !completion.verified : false,
            verifyType: task.verify_type || 'manual',
            telegramChatId: task.telegram_chat_id || undefined,
            referralTarget: task.referral_target || 0
          };
        });
        console.log('formattedTasks:', formattedTasks);
        setTasks(formattedTasks);
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
      setTasks([]);
    } finally {
      setTasksLoading(false);
    }
  };

  const toggleTask = (id: number) => {
    haptic.light();
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const handleCompleteTask = async (taskId: number, url: string) => {
    console.log('handleCompleteTask called', { taskId, url, user: !!user, userId: user?.id });
    
    if (!user) {
      console.error('User not loaded yet');
      return;
    }

    const task = tasks.find(t => t.id === taskId);
    console.log('Task found:', task);
    if (!task || task.completed) return;

    if (task.verifying) {
      // Prevent double-click
      if (verifyingTaskId === taskId) return;
      setVerifyingTaskId(taskId);
      
      console.log('VERIFY: task verifyType:', task.verifyType);
      
      try {
        let result: any = null;
        
        if (task.verifyType === 'telegram') {
          // Telegram tasks need actual membership verification
          const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
          if (!tgUser) {
            console.error('No Telegram user data available');
            showToast('Unable to verify Telegram membership. Please open in Telegram.', 'error');
            setVerifyingTaskId(null);
            return;
          }
          
          // Call Telegram verification via Edge Function
          console.log('Calling verifyTelegramMembership with:', { telegramId: tgUser.id, chatId: task.telegramChatId });
          const verified = await DataService.verifyTelegramMembership(
            tgUser.id,
            task.telegramChatId || ''
          );
          console.log('Telegram verification result:', verified);
          
          if (!verified) {
            console.log('Telegram membership not confirmed');
            showToast('You must complete the task first!', 'error');
            setVerifyingTaskId(null);
            // Reset task back to GO state
            console.log('Deleting task completion for taskId:', taskId);
            const deleted = await DataService.deleteTaskCompletion(user.id, taskId);
            console.log('Delete result:', deleted);
            loadTasks();
            return;
          }
          
          // Telegram verified, now complete the task
          result = await DataService.verifyTask(user.id, taskId, true);
          
        } else if (task.verifyType === 'referral') {
          // Referral tasks need to check referral count via RPC
          console.log('Using autoVerifyAndCredit for referral task');
          result = await DataService.autoVerifyAndCredit(user.id, taskId);
          
          if (!result) {
            console.log('Referral verification failed - not enough referrals');
            showToast('You must complete the task first!', 'warning');
            setVerifyingTaskId(null);
            // Reset task back to GO state
            console.log('Deleting task completion for taskId:', taskId);
            const deleted = await DataService.deleteTaskCompletion(user.id, taskId);
            console.log('Delete result:', deleted);
            loadTasks();
            return;
          }
          
        } else {
          // Auto and manual tasks - simple verify
          result = await DataService.verifyTask(user.id, taskId, true);
        }
        
        console.log('VERIFY: result:', result);
        haptic.success();
        loadTasks();
      } catch (error) {
        console.error('Failed to verify task:', error);
      } finally {
        setVerifyingTaskId(null);
      }
    } else {
      // First click - GO
      console.log('GO: task verifyType:', task.verifyType, 'url:', url);
      
      // Open URL for tasks that have one
      if (url && url !== '#') {
        window.open(url, '_blank');
      }
      
      try {
        const result = await DataService.completeTask(user.id, taskId);
        console.log('GO: result:', result);
        haptic.light();
        loadTasks();
      } catch (error) {
        console.error('Failed to complete task:', error);
      }
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const completedCount = tasks.filter(task => task.completed).length;
  const totalCount = tasks.length;

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="w-full max-w-md md:max-w-2xl lg:max-w-3xl mx-auto px-4 pb-8 pt-6">
        
        {/* Header */}
        <div className={`mb-6 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="relative p-6 rounded-3xl bg-gray-900 border border-gray-800 shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl"></div>
            
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-white">Tasks</h1>
                  <p className="text-sm text-gray-400 mt-1">Complete tasks to earn rewards</p>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-2">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-gray-300 font-medium">{completedCount} of {totalCount}</span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>{totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}% complete</span>
                  <span>{totalCount - completedCount} remaining</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className={`mb-6 transition-all duration-700 delay-100 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex gap-2 p-1 bg-gray-900 rounded-xl border border-gray-800">
            {(['all', 'active', 'completed'] as const).map((filterType) => (
              <button
                key={filterType}
                onClick={() => {
                  setFilter(filterType);
                  haptic.light();
                }}
                className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                  filter === filterType
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tasks List */}
        {tasksLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className={`space-y-3 transition-all duration-700 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="group relative p-4 rounded-2xl bg-gray-900 border border-gray-800 shadow-lg hover:shadow-xl hover:border-gray-700 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1 min-w-0">
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center transition-all duration-200 ${
                        task.completed
                          ? 'bg-green-600 border-green-600'
                          : 'border-gray-600 hover:border-blue-500'
                      }`}
                    >
                      {task.completed && (
                        <span className="text-white text-xs">✓</span>
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-600/20 text-blue-400">
                          {task.reward}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={function() {
                      console.log('CLICK', task.id, task.linkUrl);
                      handleCompleteTask(task.id, task.linkUrl);
                    }}
                    disabled={task.completed || verifyingTaskId === task.id}
                    style={{
                      backgroundColor: task.completed ? '#374151' : (verifyingTaskId === task.id ? '#6b7280' : (task.verifying ? '#16a34a' : '#2563eb')),
                      color: task.completed ? '#9ca3af' : 'white',
                      padding: '10px 20px',
                      borderRadius: '12px',
                      fontWeight: '500',
                      fontSize: '14px',
                      cursor: task.completed || verifyingTaskId === task.id ? 'not-allowed' : 'pointer',
                      border: 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    {task.completed ? 'Completed' : verifyingTaskId === task.id ? 'Loading...' : (task.verifying ? 'VERIFY' : 'GO')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
          </div>
        )}

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
      </div>
    </div>
  );
};

export default TaskPage;