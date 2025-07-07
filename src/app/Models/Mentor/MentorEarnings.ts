export interface MentorEarnings {
  totalEarnings: number;
  thisMonthEarnings: number;
  lastMonthEarnings: number;
  completedSessions: number;
  upcomingSessions: number;
  pendingSessions: number; // Changed from pendingBookings to pendingSessions
  monthlyEarnings?: {
    month: string;
    amount: number;
  }[];
}