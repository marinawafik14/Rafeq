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
