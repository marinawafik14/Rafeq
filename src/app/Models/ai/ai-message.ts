export interface AiMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  attachments?: FileAttachment[];
  metadata?: {
    tokensUsed?: number;
    model?: string;
    processingTime?: number;
  };
}