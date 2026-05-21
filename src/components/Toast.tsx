import React, { createContext, useContext, useState, useCallback } from 'react'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

interface ToastContextType {
  showToast: (message: string, type?: Toast['type']) => void
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {}
})

export function useToast() {
  return useContext(ToastContext)
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [idCounter, setIdCounter] = useState(0)

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const newId = idCounter + 1
    setIdCounter(newId)
    setToasts(prev => [...prev, { id: newId, message, type }])
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newId))
    }, 4000)
  }, [idCounter])

  const getStyles = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return { bg: 'bg-green-600', border: 'border-green-400' }
      case 'error':
        return { bg: 'bg-red-600', border: 'border-red-400' }
      case 'warning':
        return { bg: 'bg-yellow-600', border: 'border-yellow-400' }
      default:
        return { bg: 'bg-blue-600', border: 'border-blue-400' }
    }
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-md px-4">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`${getStyles(toast.type).bg} ${getStyles(toast.type).border} border rounded-xl px-4 py-3 shadow-lg animate-slide-down`}
            style={{
              animation: 'slideDown 0.3s ease-out'
            }}
          >
            <p className="text-white text-sm font-medium text-center">{toast.message}</p>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </ToastContext.Provider>
  )
}