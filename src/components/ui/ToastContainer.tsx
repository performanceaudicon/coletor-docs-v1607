import React, { useState, useEffect } from 'react'
import Toast, { ToastProps } from './Toast'
import { notificationSystem } from '../../lib/notificationSystem'

const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  useEffect(() => {
    const unsubscribe = notificationSystem.subscribe((notification) => {
      // Only show non-persistent notifications as toasts
      if (!notification.persistent) {
        const toast: ToastProps = {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          duration: 5000,
          onDismiss: handleDismiss
        }
        
        setToasts(prev => [...prev, toast])
      }
    })

    return unsubscribe
  }, [])

  const handleDismiss = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  )
}

export default ToastContainer