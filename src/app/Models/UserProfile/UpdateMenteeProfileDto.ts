export interface UpdateMenteeProfile {
  fullName?: string;
  email?: string;
  password?: string;
  profilePicture?: string;
  bio?: string;
  skillIds?: number[]; 
}
