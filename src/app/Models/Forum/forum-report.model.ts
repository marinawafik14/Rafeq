export interface ForumReport {
  reportId: number;
  postId: number;
  reportedByUserId: number;
  reason: string;
  createdAt: string;
  status: string; 
  adminNote?: string;
  postTitle: string;
  postOwnerName?: string | null;
  reportedByUserName: string;
}