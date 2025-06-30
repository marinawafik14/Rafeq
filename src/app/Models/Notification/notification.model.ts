
export interface NotificationDto {
  notificationId: number;
  message: string;
  isRead: boolean;
  type: 'SessionReminder' | 'NewBooking' | 'NewReview' | 'PaymentConfirmed' | 'BookingCancelled' | 'SystemNotification';
  relatedEntityId?: number;
  createdAt: Date;
}