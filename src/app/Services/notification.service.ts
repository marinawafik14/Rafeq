import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../environments/environment.development';
import { AuthService } from './auth.service';
import { NotificationDto } from '../Models/Notification/notification.model';
import { NotificationResponse, MarkAsReadResponse } from '../Models/Notification/notification-response.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly baseUrl = `${environment.apiUrl}/Notifications`;
  
  // Reactive state management
  private notificationsSubject = new BehaviorSubject<NotificationDto[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);
  
  public notifications$ = this.notificationsSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    // Load initial notifications when service is created
    this.loadInitialNotifications();
  }

  /**
   * Get all notifications for the current user
   */
  async getNotifications(): Promise<NotificationResponse> {
    try {
      const response = await this.http.get<NotificationResponse>(this.baseUrl).toPromise();

      if (response?.success && response.data) {
        // Convert date strings to Date objects
        const notifications = response.data.map(n => ({
          ...n,
          createdAt: new Date(n.createdAt)
        }));

        // Update local state
        this.notificationsSubject.next(notifications);
        this.updateUnreadCount(notifications);

        return { ...response, data: notifications };
      }

      return response || { success: false, message: 'No response received' };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return { 
        success: false, 
        message: 'Failed to fetch notifications',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<MarkAsReadResponse> {
    try {
      const response = await this.http.put<MarkAsReadResponse>(`${this.baseUrl}/read-all`, {}).toPromise();

      if (response?.success) {
        // Update local notifications to mark all as read
        const notifications = this.notificationsSubject.value.map(n => ({
          ...n,
          isRead: true
        }));
        this.notificationsSubject.next(notifications);
        
        // Update unread count to 0
        this.unreadCountSubject.next(0);
      }

      return response || { success: false, message: 'No response received', count: 0 };
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      return { 
        success: false, 
        message: 'Failed to mark notifications as read',
        count: 0
      };
    }
  }

  /**
   * Get current unread count
   */
  getUnreadCount(): number {
    return this.unreadCountSubject.value;
  }

  /**
   * Get current notifications
   */
  getCurrentNotifications(): NotificationDto[] {
    return this.notificationsSubject.value;
  }

  /**
   * Filter notifications by type
   */
  getNotificationsByType(type: string): NotificationDto[] {
    return this.notificationsSubject.value.filter(n => n.type === type);
  }

  /**
   * Get unread notifications only
   */
  getUnreadNotifications(): NotificationDto[] {
    return this.notificationsSubject.value.filter(n => !n.isRead);
  }

  /**
   * Add a new notification (for real-time updates)
   */
  addNotification(notification: NotificationDto): void {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = [notification, ...currentNotifications];
    this.notificationsSubject.next(updatedNotifications);
    this.updateUnreadCount(updatedNotifications);
  }

  /**
   * Update a specific notification (for real-time updates)
   */
  updateNotification(notificationId: number, updates: Partial<NotificationDto>): void {
    const notifications = this.notificationsSubject.value.map(n => 
      n.notificationId === notificationId ? { ...n, ...updates } : n
    );
    this.notificationsSubject.next(notifications);
    this.updateUnreadCount(notifications);
  }

  /**
   * Load initial notifications
   */
  private async loadInitialNotifications(): Promise<void> {
    // Only load if user is authenticated
    if (this.authService.isLoggedIn()) {
      await this.getNotifications();
    }
  }

  /**
   * Update unread count based on notifications
   */
  private updateUnreadCount(notifications: NotificationDto[]): void {
    const unreadCount = notifications.filter(n => !n.isRead).length;
    this.unreadCountSubject.next(unreadCount);
  }

  /**
   * Refresh notifications (manual refresh)
   */
  async refreshNotifications(): Promise<void> {
    await this.getNotifications();
  }
}