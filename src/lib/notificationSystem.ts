// Real-time notification system
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: string
  read: boolean
  persistent: boolean
  actions?: NotificationAction[]
  metadata?: Record<string, any>
}

export interface NotificationAction {
  id: string
  label: string
  action: () => void
  variant?: 'primary' | 'secondary' | 'danger'
}

export type NotificationListener = (notification: Notification) => void

class NotificationSystem {
  private static instance: NotificationSystem
  private notifications: Notification[] = []
  private listeners: NotificationListener[] = []
  private maxNotifications = 50

  static getInstance(): NotificationSystem {
    if (!NotificationSystem.instance) {
      NotificationSystem.instance = new NotificationSystem()
    }
    return NotificationSystem.instance
  }

  subscribe(listener: NotificationListener): () => void {
    this.listeners.push(listener)
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  notify(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): string {
    const newNotification: Notification = {
      ...notification,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      read: false
    }

    this.notifications.unshift(newNotification)
    
    // Limit notifications
    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.maxNotifications)
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(newNotification))

    // Auto-dismiss non-persistent notifications
    if (!notification.persistent) {
      setTimeout(() => {
        this.dismiss(newNotification.id)
      }, 5000)
    }

    // Save to localStorage for persistence
    this.saveNotifications()

    return newNotification.id
  }

  success(title: string, message: string, actions?: NotificationAction[]): string {
    return this.notify({
      type: 'success',
      title,
      message,
      persistent: false,
      actions
    })
  }

  error(title: string, message: string, persistent = true, actions?: NotificationAction[]): string {
    return this.notify({
      type: 'error',
      title,
      message,
      persistent,
      actions
    })
  }

  warning(title: string, message: string, persistent = false, actions?: NotificationAction[]): string {
    return this.notify({
      type: 'warning',
      title,
      message,
      persistent,
      actions
    })
  }

  info(title: string, message: string, persistent = false, actions?: NotificationAction[]): string {
    return this.notify({
      type: 'info',
      title,
      message,
      persistent,
      actions
    })
  }

  dismiss(id: string): void {
    const index = this.notifications.findIndex(n => n.id === id)
    if (index > -1) {
      this.notifications.splice(index, 1)
      this.saveNotifications()
    }
  }

  markAsRead(id: string): void {
    const notification = this.notifications.find(n => n.id === id)
    if (notification) {
      notification.read = true
      this.saveNotifications()
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true)
    this.saveNotifications()
  }

  getNotifications(): Notification[] {
    return [...this.notifications]
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length
  }

  clear(): void {
    this.notifications = []
    this.saveNotifications()
  }

  // Document-specific notifications
  documentUploaded(documentName: string, category: string): string {
    return this.success(
      'Documento enviado',
      `${documentName} foi enviado com sucesso na categoria ${category}`,
      [{
        id: 'view',
        label: 'Ver documento',
        action: () => console.log('Navigate to document')
      }]
    )
  }

  documentRejected(documentName: string, reason: string): string {
    return this.error(
      'Documento rejeitado',
      `${documentName} foi rejeitado: ${reason}`,
      true,
      [{
        id: 'reupload',
        label: 'Enviar novamente',
        action: () => console.log('Reupload document'),
        variant: 'primary'
      }]
    )
  }

  reminderSent(startupName: string): string {
    return this.info(
      'Lembrete enviado',
      `Lembrete enviado para ${startupName} via WhatsApp`
    )
  }

  deadlineApproaching(startupName: string, daysLeft: number): string {
    return this.warning(
      'Prazo se aproximando',
      `${startupName} tem ${daysLeft} dias para enviar os documentos`,
      true,
      [{
        id: 'send-reminder',
        label: 'Enviar lembrete',
        action: () => console.log('Send reminder'),
        variant: 'primary'
      }]
    )
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }

  private saveNotifications(): void {
    try {
      localStorage.setItem('notifications', JSON.stringify(this.notifications))
    } catch (error) {
      console.error('Failed to save notifications:', error)
    }
  }

  private loadNotifications(): void {
    try {
      const saved = localStorage.getItem('notifications')
      if (saved) {
        this.notifications = JSON.parse(saved)
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
      this.notifications = []
    }
  }

  constructor() {
    this.loadNotifications()
  }
}

export const notificationSystem = NotificationSystem.getInstance()