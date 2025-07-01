export const environment = {
  production: false,
  apiUrl: 'https://localhost:7001/api',
  // AI Configuration with updated API key
  openai: {
    apiKey: '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',
    chatApiUrl: 'https://api.openai.com/v1/chat/completions',
    embeddingApiUrl: 'https://api.openai.com/v1/embeddings',
    chatModel: 'gpt-4o-mini',
    embeddingModel: 'text-embedding-3-small',
    maxFileSize: 25 * 1024 * 1024, // 25MB
    maxImageSize: 10 * 1024 * 1024, // 10MB
  }
};
