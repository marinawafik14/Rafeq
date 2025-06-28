export interface FaqDto {
  faqId: number;
  question: string;
  answer: string;
  category?: string;
  sortOrder: number;
  viewCount: number;
}
