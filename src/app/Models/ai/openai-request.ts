export interface OpenaiRequest {
  model: string;
  messages: {
    role: 'user' | 'assistant' | 'system';
    content: string | Array<{
      type: 'text' | 'image_url';
      text?: string;
      image_url?: {
        url: string;
      };
    }>;
  }[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface EmbeddingRequest {
  model: string;
  input: string;
}
