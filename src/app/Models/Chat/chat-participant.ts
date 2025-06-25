export interface ChatParticipant {
  userId: number;
  fullName: string;
  profilePicture?: string;
  hourlyRate?: number;
  isOnline?: boolean;
}
