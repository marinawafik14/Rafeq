export interface MentorEarnings {
  totalEarnings: number;
  pendingEarnings: number;
  completedSessions: number;
  upcomingSessions: number;
  monthlyEarnings: {
    month: string;
    amount: number;
  }[];
}