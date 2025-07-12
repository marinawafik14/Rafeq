export const environment = {
  production: false,
  apiUrl: 'https://rafeeq-1.runasp.net/api',
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
