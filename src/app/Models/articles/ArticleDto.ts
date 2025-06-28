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
