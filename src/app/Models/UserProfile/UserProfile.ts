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
  mentorSkills?: { id: number; name: string; }[]; // Detailed skills for mentor
  menteeSkills?: { id: number; name: string; }[]; // Detailed skills for mentee
  skills?: string[]; // Simplified list of skill names (if your backend returns it)
  availabilities?: any[]; // Assuming AvailabilityDto, define if needed
}
