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
