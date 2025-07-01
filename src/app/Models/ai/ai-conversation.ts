export interface AiConversation {
  id: string;
  title: string;
  userId: number;
  messages: AiMessage[];
  createdAt: Date;
  updatedAt: Date;
  mode: 'general' | 'cv-analysis' | 'career-advice';
}
