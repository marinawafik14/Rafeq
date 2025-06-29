export interface ArticleDto {
  articleId: number;
  title: string;
  content: string;
  summary?: string;
  category?: string;
  authorId: number;
  authorName: string;
  viewCount: number;
  createdAt: Date;
  updatedAt?: Date;
}
export interface ArticleListDto {
  articleId: number;
  title: string;
  summary: string;
  category: string;
  authorName?: string;
  viewCount: number;
  createdAt: Date;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}
