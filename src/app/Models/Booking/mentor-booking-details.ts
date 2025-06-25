export interface MentorBookingDetails {
  bookingId: number;
  mentorId: number;
  mentorName: string;
  menteeId: number;
  menteeName: string;
  sessionType: string; // 'Mentorship' or 'Interview'
  startDateTime: Date;
  endDateTime: Date;
  status: string; // 'Pending', 'Confirmed', 'InProgress', 'Completed', 'Cancelled'
  googleMeetLink?: string;
  paymentStatus: string; // 'Paid', 'Unpaid'
  totalAmount: number;
  commission?: number;
  createdAt: Date;
}
