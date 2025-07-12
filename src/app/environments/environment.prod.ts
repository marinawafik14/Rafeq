export const environment = {
  production: true,
  apiUrl: 'https://rafeeq.free.nf/api',  
  openai: {
    apiKey: 'sk-proj-...',
    chatApiUrl: 'https://api.openai.com/v1/chat/completions',
    embeddingApiUrl: 'https://api.openai.com/v1/embeddings',
    chatModel: 'gpt-4o-mini',
    embeddingModel: 'text-embedding-3-small',
    maxFileSize: 25 * 1024 * 1024,
    maxImageSize: 10 * 1024 * 1024,
  }
};
