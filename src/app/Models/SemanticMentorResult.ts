export interface SemanticMentorResult {
  userId: number;
  fullName: string;
  bio: string;
  hourlyRate: number;
  similarityScore: number;
  skills: string[];
  averageRating: number;
  profilePicture: string | null;
}