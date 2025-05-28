export class Bookings {
    BookingId!: number;
  MentorId!: number;
  MenteeId!: number;
  SessionType!: string; // 'Mentorship' or 'Interview'
  StartDateTime?: Date;
  EndDateTime?: Date;
  Status: string = "Pending"; // Pending, Confirmed, Completed, Cancelled
  GoogleMeetLink?: string;
  PaymentStatus: string ="Unpaid"; // Unpaid, Paid
  TotalAmount?: number;
  Commission?: number;
  CreatedAt?: Date;
  UpdatedAt?: Date;
  IsDeleted!: boolean;
}
