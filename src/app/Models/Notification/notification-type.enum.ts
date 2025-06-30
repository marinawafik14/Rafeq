export enum NotificationType {
  SessionReminder = 'SessionReminder',
  NewBooking = 'NewBooking',
  NewReview = 'NewReview',
  PaymentConfirmed = 'PaymentConfirmed',
  BookingCancelled = 'BookingCancelled',
  SystemNotification = 'SystemNotification'
}

export const NotificationTypeLabels = {
  [NotificationType.SessionReminder]: 'Session Reminder',
  [NotificationType.NewBooking]: 'New Booking',
  [NotificationType.NewReview]: 'New Review',
  [NotificationType.PaymentConfirmed]: 'Payment Confirmed',
  [NotificationType.BookingCancelled]: 'Booking Cancelled',
  [NotificationType.SystemNotification]: 'System Notification'
};