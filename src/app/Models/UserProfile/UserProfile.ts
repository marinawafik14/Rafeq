export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  profilePicture?: string;
  bio?: string;
  isEmailVerified: boolean;
  role: string;
  isActive: boolean;
  createdAt: Date;
  isMentor: boolean;
  isInterviewer?: boolean;
  hourlyRate?: number;
  mentorSkills?: { id: number; name: string; }[];
 menteeSkills?: { id: number; name: string; }[];
   skills?: string[];
  availabilities?: any[];
}
