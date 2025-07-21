import api from './api';

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  data?: any;
}

class NotificationService {
  private listeners: ((notifications: Notification[]) => void)[] = [];
  private notifications: Notification[] = [];

  // Subscribe to notification updates
  subscribe(callback: (notifications: Notification[]) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Notify all subscribers
  private notify() {
    this.listeners.forEach(callback => callback(this.notifications));
  }

  // Fetch notifications from server
  async fetchNotifications() {
    try {
      const response = await api.get('/notifications');
      this.notifications = response.data.notifications || [];
      this.notify();
      return this.notifications;
    } catch (error: any) {
      // Handle rate limiting gracefully
      if (error.response?.status === 429) {
        console.warn('Rate limited while fetching notifications. Will retry later.');
        return this.notifications; // Return existing notifications
      }
      console.error('Failed to fetch notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string) {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      this.notifications = this.notifications.map(notification =>
        notification._id === notificationId
          ? { ...notification, read: true }
          : notification
      );
      this.notify();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      await api.put('/notifications/read-all');
      this.notifications = this.notifications.map(notification => ({
        ...notification,
        read: true
      }));
      this.notify();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }

  // Get unread count
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  // Add local notification (for immediate feedback)
  addLocalNotification(notification: Omit<Notification, '_id' | 'createdAt'>) {
    const newNotification: Notification = {
      ...notification,
      _id: `local-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    
    this.notifications.unshift(newNotification);
    this.notify();

    // Auto-remove after 5 seconds for success/info notifications
    if (notification.type === 'success' || notification.type === 'info') {
      setTimeout(() => {
        this.notifications = this.notifications.filter(n => n._id !== newNotification._id);
        this.notify();
      }, 5000);
    }
  }

  // Show success notification
  showSuccess(title: string, message: string) {
    this.addLocalNotification({
      title,
      message,
      type: 'success',
      read: false
    });
  }

  // Show error notification
  showError(title: string, message: string) {
    this.addLocalNotification({
      title,
      message,
      type: 'error',
      read: false
    });
  }

  // Show info notification
  showInfo(title: string, message: string) {
    this.addLocalNotification({
      title,
      message,
      type: 'info',
      read: false
    });
  }

  // Show warning notification
  showWarning(title: string, message: string) {
    this.addLocalNotification({
      title,
      message,
      type: 'warning',
      read: false
    });
  }

  // Check for upcoming shows and notify
  async checkUpcomingShows() {
    try {
      const response = await api.get('/schedule?upcoming=true');
      const upcomingShows = response.data.schedule || [];
      
      const now = new Date();
      const in15Minutes = new Date(now.getTime() + 15 * 60 * 1000);
      
      upcomingShows.forEach((show: any) => {
        const showStart = new Date(show.startTime);
        
        // Notify if show starts within 15 minutes
        if (showStart <= in15Minutes && showStart > now) {
          const minutesUntil = Math.ceil((showStart.getTime() - now.getTime()) / (1000 * 60));
          
          this.showInfo(
            'Show Starting Soon',
            `"${show.title}" starts in ${minutesUntil} minute${minutesUntil !== 1 ? 's' : ''}`
          );
        }
      });
    } catch (error: any) {
      // Handle rate limiting gracefully
      if (error.response?.status === 429) {
        console.warn('Rate limited while checking upcoming shows. Will retry later.');
        return;
      }
      console.error('Failed to check upcoming shows:', error);
    }
  }

  // Start periodic checks for upcoming shows
  startUpcomingShowsCheck() {
    // Don't check immediately to avoid rate limiting on page load
    // Wait 10 seconds before first check
    setTimeout(() => {
      this.checkUpcomingShows();
    }, 10000);
    
    // Then check every 10 minutes (reduced frequency)
    const interval = setInterval(() => {
      this.checkUpcomingShows();
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }
}

export const notificationService = new NotificationService();