export interface CVComment {
  commentId: number;
  cvId: number;
  mentorId: number;
  mentorName: string;
  comment: string;
  createdAt: Date;
  updatedAt?: Date;
}