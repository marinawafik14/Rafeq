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
  

  private notificationsSubject = new BehaviorSubject<NotificationDto[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);
  
  public notifications$ = this.notificationsSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
 
    this.loadInitialNotifications();
  }

 
  async getNotifications(): Promise<NotificationResponse> {
    try {
      const response = await this.http.get<NotificationResponse>(this.baseUrl).toPromise();

      if (response?.success && response.data) {
      
        const notifications = response.data.map(n => ({
          ...n,
          createdAt: new Date(n.createdAt)
        }));

     
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

  
  async markAllAsRead(): Promise<MarkAsReadResponse> {
    try {
      const response = await this.http.put<MarkAsReadResponse>(`${this.baseUrl}/read-all`, {}).toPromise();

      if (response?.success) {
       
        const notifications = this.notificationsSubject.value.map(n => ({
          ...n,
          isRead: true
        }));
        this.notificationsSubject.next(notifications);
        
      
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

 
  getUnreadCount(): number {
    return this.unreadCountSubject.value;
  }

 
  getCurrentNotifications(): NotificationDto[] {
    return this.notificationsSubject.value;
  }

  
  getNotificationsByType(type: string): NotificationDto[] {
    return this.notificationsSubject.value.filter(n => n.type === type);
  }

  
  getUnreadNotifications(): NotificationDto[] {
    return this.notificationsSubject.value.filter(n => !n.isRead);
  }

  
  addNotification(notification: NotificationDto): void {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = [notification, ...currentNotifications];
    this.notificationsSubject.next(updatedNotifications);
    this.updateUnreadCount(updatedNotifications);
  }

  
  updateNotification(notificationId: number, updates: Partial<NotificationDto>): void {
    const notifications = this.notificationsSubject.value.map(n => 
      n.notificationId === notificationId ? { ...n, ...updates } : n
    );
    this.notificationsSubject.next(notifications);
    this.updateUnreadCount(notifications);
  }

 
  private async loadInitialNotifications(): Promise<void> {
   
    if (this.authService.isLoggedIn()) {
      await this.getNotifications();
    }
  }

  
  private updateUnreadCount(notifications: NotificationDto[]): void {
    const unreadCount = notifications.filter(n => !n.isRead).length;
    this.unreadCountSubject.next(unreadCount);
  }

 
  async refreshNotifications(): Promise<void> {
    await this.getNotifications();
  }
}