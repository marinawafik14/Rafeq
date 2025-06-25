export interface BookingStatusUpdate {
  status: 'Pending' | 'Confirmed' | 'InProgress' | 'Completed' | 'Cancelled';
  reason?: string; // For cancellations
}
