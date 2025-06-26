export interface SessionDetails {
  bookingId: number;
  mentorName: string;
  menteeName: string;
  sessionType: string;
  startDateTime: Date;
  endDateTime: Date;
  duration: number; // in minutes
  status: string;
  description?: string;
  objectives?: string[];
}
