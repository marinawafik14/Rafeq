export interface MentorSkill {
  id: number;
  name: string;
  mentorsCount: number;
}

export interface MentorAvailability {
  availabilityId: number;
  userId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  dayName: string;
}

export interface MentorProfile {
  id: number;
  fullName: string;
  email: string;
  role: string;
  hourlyRate: number;
  mentorSkills: MentorSkill[];
  userId: number;
  profilePicture: string;
  bio: string;
  skills: string[];
  availabilities: MentorAvailability[];
  isMentor: boolean;
  isInterviewer: boolean;
  // Optional properties that might be added later
  rating?: number;
  reviews?: any[];
}
