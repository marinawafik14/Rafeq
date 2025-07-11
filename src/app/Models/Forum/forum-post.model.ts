export interface ForumPost {
  postId: number;
  userId: number;
  userFullName: string; 
  userProfilePicture?: string;
  categoryId: number;
  categoryName?: string;
  title: string;
  content: string;
  isSolved: boolean;
  upvotes: number;
  createdAt: string;
  updatedAt?: string | null;
  comments?: any[];
  hasUpvoted?: boolean;
  canEditDelete?: boolean;
  canMarkAsSolved?: boolean;
  isPinned?: boolean;
}