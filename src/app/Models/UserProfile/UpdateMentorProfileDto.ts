export interface UpdateMentorProfile {
  fullName?: string;
  email?: string;
  password?: string;
  profilePicture?: string; 
  bio?: string;
  hourlyRate?: number;
  skillIds?: number[];
  isInterviewer?: boolean;
}
