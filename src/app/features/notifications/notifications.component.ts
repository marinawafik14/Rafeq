import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { NotificationService } from '../../Services/notification.service';
import { BookingService } from '../../Services/booking.service';
import { UserService } from '../../Services/user.service';
import { MentorSearchService } from '../../Services/mentor-search.service';
import { NotificationDto } from '../../Models/Notification/notification.model';
import { NotificationType, NotificationTypeLabels } from '../../Models/Notification/notification-type.enum';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule], // Removed RouterLink since it's not used in template
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications: NotificationDto[] = [];
  filteredNotifications: NotificationDto[] = [];
  unreadCount = 0;
  isLoading = true;
  hasError = false;
  errorMessage = '';

  // Filter options
  selectedFilter = 'all'; // 'all', 'unread', 'read', or specific type
  searchQuery = '';

  private subscriptions: Subscription = new Subscription();


  // Booking and mentor name cache
  private bookingMentorNameMap: { [bookingId: number]: string } = {};
  private mentorNameMap: { [mentorId: number]: string } = {};

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private bookingService: BookingService,
    private userService: UserService,
    private mentorSearchService: MentorSearchService
  ) {}

  async ngOnInit() {
    // Subscribe to notifications stream
    this.subscriptions.add(
      this.notificationService.notifications$.subscribe(async notifications => {
        this.notifications = notifications;
        await this.enrichNotificationsWithMentorNames();
        this.applyFilters();
        this.isLoading = false;
      })
    );

    // Subscribe to unread count stream
    this.subscriptions.add(
      this.notificationService.unreadCount$.subscribe(count => {
        this.unreadCount = count;
      })
    );

    // Load initial notifications
    await this.loadNotifications();
  }

  // Enrich notifications with mentor names for booking-related notifications
async enrichNotificationsWithMentorNames() {
  const bookingIds: number[] = this.notifications
    .filter(n => n.relatedEntityId && 
           ['SessionReminder', 'NewBooking', 'BookingCancelled', 'PaymentConfirmed', 'NewMessage'].includes(n.type))
    .map(n => n.relatedEntityId!);
    // Remove duplicates
    const uniqueBookingIds = Array.from(new Set(bookingIds));

    for (const bookingId of uniqueBookingIds) {
      if (!this.bookingMentorNameMap[bookingId]) {
        try {
          const bookings = await this.bookingService.getAllBookings().toPromise();
          if (Array.isArray(bookings)) {
            const booking = bookings.find((b: any) => b.bookingId === bookingId);
            if (booking) {
              // If mentorName is missing, fetch mentor by MentorId
              if (booking.mentorName) {
                this.bookingMentorNameMap[bookingId] = booking.mentorName;
              } else if (booking.MentorId) {
                // Try to get mentor name from cache first
                if (this.mentorNameMap[booking.MentorId]) {
                  this.bookingMentorNameMap[bookingId] = this.mentorNameMap[booking.MentorId];
                } else {
                  // Fetch mentor user by id
                  try {
                    const mentorUser = await this.userService.getUserById(booking.MentorId).toPromise();
                    if (mentorUser && mentorUser.fullName) {
                      this.mentorNameMap[booking.MentorId] = mentorUser.fullName;
                      this.bookingMentorNameMap[bookingId] = mentorUser.fullName;
                    } else {
                      this.bookingMentorNameMap[bookingId] = `Mentor #${booking.MentorId}`;
                    }
                  } catch {
                    this.bookingMentorNameMap[bookingId] = `Mentor #${booking.MentorId}`;
                  }
                }
              } else {
                this.bookingMentorNameMap[bookingId] = `Mentor`;
              }
            }
          }
        } catch (e) {
          // fallback: just show id
          this.bookingMentorNameMap[bookingId] = `Mentor`;
        }
      }
    }
  }

  // Helper to get mentor name for a booking notification
//  getMentorNameForNotification(notification: NotificationDto): string {
//   if (notification.relatedEntityId) {
//     return this.bookingMentorNameMap[notification.relatedEntityId] || '';
//   }
//   return '';
// }
getMentorNameForNotification(notification: NotificationDto): string {
  if (!notification.relatedEntityId) return '';
  let rawName = this.bookingMentorNameMap[notification.relatedEntityId];
  if (!rawName) {
    // Try to fetch booking data if not cached
    this.bookingService.getAllBookings().subscribe(bookings => {
      const booking = bookings.find((b: any) => b.bookingId === notification.relatedEntityId);
      if (booking && booking.mentorName) {
        this.bookingMentorNameMap[notification.relatedEntityId!] = booking.mentorName;
        this.applyFilters();
      } else if (booking && booking.MentorId) {
        // Try MentorSearchService if mentorName is not present
        this.mentorSearchService.getMentorById(booking.MentorId).subscribe(mentor => {
          if (mentor && mentor.fullName) {
            this.bookingMentorNameMap[notification.relatedEntityId!] = mentor.fullName;
          } else {
            this.bookingMentorNameMap[notification.relatedEntityId!] = `Mentor #${booking.MentorId}`;
          }
          this.applyFilters();
        }, _err => {
          this.bookingMentorNameMap[notification.relatedEntityId!] = `Mentor #${booking.MentorId}`;
          this.applyFilters();
        });
      }
    });
    return '';
  }
  // Remove "Mentor" suffix if it exists and trim whitespace
  return rawName.replace(/\s*Mentor$/, '').trim();
}

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  async loadNotifications() {
    try {
      this.isLoading = true;
      this.hasError = false;

      const result = await this.notificationService.getNotifications();
      
      if (!result.success) {
        this.hasError = true;
        this.errorMessage = result.message || 'Failed to load notifications';
      }
    } catch (error) {
      this.hasError = true;
      this.errorMessage = 'An unexpected error occurred';
      console.error('Error loading notifications:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async markAllAsRead() {
    if (this.unreadCount === 0) return;

    try {
      const result = await this.notificationService.markAllAsRead();
      
      if (result.success) {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: `${result.count} notifications marked as read`,
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: result.message || 'Failed to mark notifications as read',
          confirmButtonColor: '#0a2e65'
        });
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'An unexpected error occurred',
        confirmButtonColor: '#0a2e65'
      });
    }
  }

  onFilterChange() {
    this.applyFilters();
  }

  onSearchChange() {
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.notifications];

    // Apply type/status filter
    switch (this.selectedFilter) {
      case 'unread':
        filtered = filtered.filter(n => !n.isRead);
        break;
      case 'read':
        filtered = filtered.filter(n => n.isRead);
        break;
      case 'SessionReminder':
      case 'NewBooking':
      case 'NewReview':
      case 'PaymentConfirmed':
      case 'BookingCancelled':
      case 'SystemNotification':
        filtered = filtered.filter(n => n.type === this.selectedFilter);
        break;
      // 'all' shows everything
    }

    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(n => 
        n.message.toLowerCase().includes(query) ||
        this.getNotificationTypeLabel(n.type).toLowerCase().includes(query)
      );
    }

    this.filteredNotifications = filtered;
  }

  getNotificationIcon(type: string): string {
    const icons: Record<string, string> = { // 🔧 Fix: Added type annotation
      'SessionReminder': 'calendar-check',
      'NewBooking': 'calendar-plus',
      'NewReview': 'star',
      'PaymentConfirmed': 'credit-card',
      'BookingCancelled': 'calendar-times',
      'SystemNotification': 'bell'
    };
    return icons[type] || 'bell';
  }

  getNotificationColor(type: string): string {
    const colors: Record<string, string> = { // 🔧 Fix: Added type annotation
      'SessionReminder': 'primary',
      'NewBooking': 'success',
      'NewReview': 'warning',
      'PaymentConfirmed': 'info',
      'BookingCancelled': 'danger',
      'SystemNotification': 'secondary'
    };
    return colors[type] || 'secondary';
  }

  getNotificationTypeLabel(type: string): string {
    return NotificationTypeLabels[type as keyof typeof NotificationTypeLabels] || type;
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  }

  onNotificationClick(notification: NotificationDto) {
    // Navigate to related entity based on notification type and relatedEntityId
    if (notification.relatedEntityId && notification.type) {
      this.navigateToRelatedEntity(notification.type, notification.relatedEntityId);
    }
  }

  private navigateToRelatedEntity(type: string, entityId: number) {
    switch (type) {
      case 'SessionReminder':
      case 'NewBooking':
      case 'BookingCancelled':
        // Navigate to bookings page or specific booking
        this.router.navigate(['/mentor/bookings']); // Adjust route as needed
        break;
      case 'NewReview':
        // Navigate to reviews or dashboard
        this.router.navigate(['/mentor/dashboard']); // Adjust route as needed
        break;
      case 'PaymentConfirmed':
        // Navigate to earnings or dashboard
        this.router.navigate(['/mentor/dashboard']); // Adjust route as needed
        break;
      default:
        console.log('Navigation not implemented for type:', type);
    }
  }

  async refreshNotifications() {
    await this.loadNotifications();
  }

  trackByNotificationId(index: number, notification: NotificationDto): number {
    return notification.notificationId;
  }
  
}