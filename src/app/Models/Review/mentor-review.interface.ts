export interface MentorReview {
  reviewId: number;
  reviewerId: number;
  reviewerName: string;
  reviewedUserId: number;
  reviewedUserName: string;
  rating: number;
  comment: string;
  createdAt: string;
}
