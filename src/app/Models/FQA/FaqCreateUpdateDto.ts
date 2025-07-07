export interface FaqCreateUpdateDto {
  question: string;
  answer: string;
  category?: string;
  sortOrder: number;
  isActive: boolean;
}
