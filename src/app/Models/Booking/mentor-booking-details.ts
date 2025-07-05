export interface MentorBookingDetails {
  bookingId: number;
  mentorId: number;
  mentorName: string;
  menteeId: number;
  menteeName: string;
  sessionType: string;
  startDateTime: Date;
  endDateTime: Date;
  status: string;
  googleMeetLink?: string | undefined; 
  paymentStatus: string;
  totalAmount: number;
  commission?: number;
  createdAt: Date;
  meetingLinkInput?: string; 
}
