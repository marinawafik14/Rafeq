export interface ForumComment {
  commentId: number;
  postId: number;
  userId: number;
  userName: string;
  content: string;
  isAnswer: boolean;
  createdAt: string;
  isDeleted: boolean;
  canEditDelete: boolean;
}