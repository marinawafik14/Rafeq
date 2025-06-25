export interface MentorBooking {
  bookingId: number;
  menteeId: number;
  menteeName?: string;
  menteeProfilePicture?: string;
  sessionType: string; // 'Mentorship' or 'Interview'
  startDateTime: Date;
  endDateTime: Date;
  status: string; // 'Pending', 'Confirmed', 'Completed', 'Cancelled'
  googleMeetLink?: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: Date;
}