export interface UserProfile {
  mentorSkills: any;
  id: number;
  fullName: string;
  email: string;
  profilePicture?: string;
  bio?: string;
  isEmailVerified: boolean;
  role: string;
  isActive: boolean;
  createdAt: string;
  isMentor: boolean;
  isInterviewer: boolean;
  hourlyRate?: number;
}
