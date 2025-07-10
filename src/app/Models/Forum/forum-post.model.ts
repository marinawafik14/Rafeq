export interface ForumPost {
  postId: number;
  title: string;
  content: string;
  isSolved: boolean;
  upvotes: number;
  createdAt: string;
  categoryName: string;
  categoryId: number;
  userId: number;
  userFullName: string;
}