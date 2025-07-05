export interface ArticleCreateUpdateDto {
  title: string;
  summary?: string;
  content: string;
  category?: string;
  isPublished: boolean;
  authorId: number;
}
