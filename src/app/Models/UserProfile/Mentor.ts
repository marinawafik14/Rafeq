import { Skill } from './Skill';

export interface Mentor {
  id: number;
  userId: number; // Corresponds to UserId in backend MentorDto
  fullName: string;
  email: string;
  role: string;
  hourlyRate: number;
  profilePicture: string;
  bio: string;
  skills: string[]; // List of skill names for display
  mentorSkills: Skill[]; // List of Skill objects with id and name
  availabilities: any[]; // Assuming AvailabilityDto, define if needed
  isMentor: boolean;
  isInterviewer?: boolean;
}
