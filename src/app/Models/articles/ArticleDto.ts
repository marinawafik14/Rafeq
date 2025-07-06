export interface ArticleDto {
 articleId: number;
  title: string;
  summary?: string;
  content: string;
  category?: string;
  isPublished: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt?: string;
  authorId?: number;
  authorName?: string;
}
export interface ArticleListDto {
  articleId: number;
  title: string;
  summary?: string;
  category?: string;
  isPublished: boolean; 
  viewCount: number;
  createdAt: string;
  authorName?: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}
