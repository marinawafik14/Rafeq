export class Bookings {
  BookingId!: number;
  MentorId!: number;
  MenteeId!: number;
  sessionType!: string; // 'Mentorship' or 'Interview'
  startDateTime?: Date;
  endDateTime?: Date;
  status: string = "Pending"; // Pending, Confirmed, Completed, Cancelled
googleMeetLink?: string;
  paymentStatus: string ="Unpaid"; // Unpaid, Paid
  totalAmount?: number;
 commission?: number;
  CreatedAt?: Date;
  UpdatedAt?: Date;
  IsDeleted!: boolean;
   mentorName?: string;
  menteeName?: string;
}
