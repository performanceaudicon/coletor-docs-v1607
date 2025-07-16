import React, { useState, useEffect } from 'react'
import { Bell, X, Check, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react'
import { notificationSystem, Notification } from '../../lib/notificationSystem'
import Button from './Button'

const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Load initial notifications
    setNotifications(notificationSystem.getNotifications())
    setUnreadCount(notificationSystem.getUnreadCount())

    // Subscribe to new notifications
    const unsubscribe = notificationSystem.subscribe((notification) => {
      setNotifications(notificationSystem.getNotifications())
      setUnreadCount(notificationSystem.getUnreadCount())
    })

    return unsubscribe
  }, [])

  const handleDismiss = (id: string) => {
    notificationSystem.dismiss(id)
  }

  const handleMarkAsRead = (id: string) => {
    notificationSystem.markAsRead(id)
  }

  const handleMarkAllAsRead = () => {
    notificationSystem.markAllAsRead()
    setUnreadCount(0)
  }

  const handleClearAll = () => {
    notificationSystem.clear()
    setNotifications([])
    setUnreadCount(0)
  }

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const getBgColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'info':
        return 'bg-blue-50 border-blue-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-orange-600 transition-colors"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notificações</h3>
              <div className="flex space-x-2">
                {unreadCount > 0 && (
                  <Button size="sm" variant="secondary" onClick={handleMarkAllAsRead}>
                    <Check className="h-4 w-4 mr-1" />
                    Marcar todas
                  </Button>
                )}
                <Button size="sm" variant="secondary" onClick={handleClearAll}>
                  Limpar
                </Button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhuma notificação</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 ${getBgColor(notification.type)} ${
                    !notification.read ? 'border-l-4 border-l-orange-500' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {getIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </p>
                        <button
                          onClick={() => handleDismiss(notification.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(notification.timestamp).toLocaleString('pt-BR')}
                      </p>
                      
                      {/* Actions */}
                      {notification.actions && notification.actions.length > 0 && (
                        <div className="flex space-x-2 mt-3">
                          {notification.actions.map((action) => (
                            <Button
                              key={action.id}
                              size="sm"
                              variant={action.variant || 'secondary'}
                              onClick={() => {
                                action.action()
                                handleMarkAsRead(notification.id)
                              }}
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      )}
                      
                      {!notification.read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="text-xs text-orange-600 hover:text-orange-700 mt-2"
                        >
                          Marcar como lida
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationCenter