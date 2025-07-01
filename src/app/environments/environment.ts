export const environment = {
  production: false,
  apiUrl: 'https://localhost:7001/api',
  // AI Configuration from your chatbotPlan.md
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
