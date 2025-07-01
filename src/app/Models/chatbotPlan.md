# Angular AI Chatbot Implementation Plan

## 🎯 Project Overview
Create a modern Angular chatbot application with AI capabilities including chat with files, image analysis, and semantic search using OpenAI APIs. This is a frontend-only implementation using localStorage for data persistence.

## 🔑 API Configuration

### OpenAI API Key
```typescript
// Use this exact API key in your environment files
API_KEY = "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"
```

### API Endpoints & Models
```typescript
// Configuration object to use
export const CONFIG = {
  // OpenAI API Settings
  API_KEY: "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",
  OPENAI_API_URL: "https://api.openai.com/v1/chat/completions",
  EMBEDDING_URL: "https://api.openai.com/v1/embeddings",
  
  // Models to use
  CHAT_MODEL: "gpt-4o-mini",  // Main chat model - cost effective and powerful
  EMBEDDING_MODEL: "text-embedding-3-small", // For semantic search - 1536 dimensions
  
  // File limits
  MAX_FILE_SIZE: 25 * 1024 * 1024, // 25MB
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  
  // Application modes
  MODES: {
    CHAT: 'chat',
    CV_ANALYSIS: 'cv-analysis'
  }
};
```

## 🏗️ Angular Architecture

### Core Services Needed

#### 1. OpenAI Service
```typescript
@Injectable({
  providedIn: 'root'
})
export class OpenAIService {
  private apiKey = CONFIG.API_KEY;
  private baseUrl = CONFIG.OPENAI_API_URL;
  
  // Chat completions
  async sendMessage(messages: any[]): Promise<any>
  
  // Create embeddings for semantic search
  async createEmbedding(text: string): Promise<number[]>
  
  // Multimodal chat (text + images)
  async sendMultimodalMessage(messages: any[]): Promise<any>
}
```

#### 2. File Processing Service
```typescript
@Injectable({
  providedIn: 'root'
})
export class FileProcessingService {
  // Extract text from PDF using PDF.js
  async extractTextFromPDF(file: File): Promise<string>
  
  // Process images for vision API
  async processImageFile(file: File): Promise<string> // Returns base64
  
  // Validate file types and sizes
  validateFile(file: File): boolean
}
```

#### 3. Storage Service (LocalStorage)
```typescript
@Injectable({
  providedIn: 'root'
})
export class StorageService {
  // Chat history management
  saveChatHistory(userId: string, chats: Chat[]): void
  loadChatHistory(userId: string): Chat[]
  
  // CV analysis storage
  saveAnalysis(analysis: CVAnalysis): void
  getAnalyses(userId: string): CVAnalysis[]
  
  // Embeddings storage for semantic search
  saveEmbedding(id: string, embedding: number[]): void
  getEmbeddings(): Map<string, number[]>
}
```

#### 4. RAG Service (Retrieval-Augmented Generation)
```typescript
@Injectable({
  providedIn: 'root'
})
export class RagService {
  // Find similar documents using embeddings
  findSimilarDocuments(queryEmbedding: number[], limit: number): SimilarDocument[]
  
  // Get relevant context for queries
  getRelevantContext(query: string): Promise<string>
  
  // Calculate cosine similarity between vectors
  cosineSimilarity(a: number[], b: number[]): number
}
```

## 📱 Component Structure

### Main Components

#### 1. Chat Component
```typescript
@Component({
  selector: 'app-chat',
  template: `
    <div class="chat-container">
      <div class="messages" #messagesContainer>
        <app-message 
          *ngFor="let message of messages" 
          [message]="message">
        </app-message>
      </div>
      
      <app-input-area 
        (messageSubmit)="onMessageSubmit($event)"
        (fileUpload)="onFileUpload($event)">
      </app-input-area>
    </div>
  `
})
export class ChatComponent {
  messages: Message[] = [];
  currentMode: string = 'chat';
  
  async onMessageSubmit(data: {text: string, file?: File, image?: File})
  async sendToOpenAI(messages: any[])
}
```

#### 2. Message Component
```typescript
@Component({
  selector: 'app-message',
  template: `
    <div class="message" [ngClass]="message.role">
      <div class="message-content">
        <div *ngIf="message.image" class="message-image">
          <img [src]="message.image" alt="Attached image">
        </div>
        
        <div *ngIf="message.file" class="message-file">
          <i [class]="getFileIcon(message.file.type)"></i>
          <span>{{ message.file.name }}</span>
        </div>
        
        <div class="text-content" [innerHTML]="getFormattedContent()"></div>
      </div>
    </div>
  `
})
export class MessageComponent {
  @Input() message: Message;
  
  getFormattedContent(): string // Use marked.js for markdown
  getFileIcon(fileType: string): string
}
```

#### 3. Input Area Component
```typescript
@Component({
  selector: 'app-input-area',
  template: `
    <div class="input-area">
      <div class="attachment-preview" *ngIf="attachedFile || attachedImage">
        <!-- File/Image preview -->
      </div>
      
      <div class="input-row">
        <button (click)="fileInput.click()" class="attach-btn">
          <i class="fas fa-paperclip"></i>
        </button>
        
        <button (click)="imageInput.click()" class="attach-btn">
          <i class="fas fa-image"></i>
        </button>
        
        <textarea 
          [(ngModel)]="messageText" 
          (keydown.enter)="onEnterKey($event)"
          placeholder="Type your message..."
          #messageTextarea>
        </textarea>
        
        <button (click)="sendMessage()" [disabled]="!canSend()">
          <i class="fas fa-paper-plane"></i>
        </button>
      </div>
      
      <input #fileInput type="file" (change)="onFileSelect($event)" hidden
             accept=".pdf,.doc,.docx,.txt">
      <input #imageInput type="file" (change)="onImageSelect($event)" hidden
             accept="image/*">
    </div>
  `
})
export class InputAreaComponent {
  @Output() messageSubmit = new EventEmitter<any>();
  @Output() fileUpload = new EventEmitter<File>();
  
  messageText: string = '';
  attachedFile: File | null = null;
  attachedImage: File | null = null;
  
  async onFileSelect(event: any)
  async onImageSelect(event: any)
  sendMessage()
}
```

## 🔧 Key Implementation Details

### PDF Text Extraction
```typescript
// Install: npm install pdfjs-dist
import * as pdfjs from 'pdfjs-dist';

async extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  
  let extractedText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    extractedText += `Page ${i}:\n${pageText}\n\n`;
  }
  
  return extractedText;
}
```

### OpenAI API Integration
```typescript
// Chat API call
async sendMessage(messages: any[]): Promise<any> {
  const response = await fetch(CONFIG.OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CONFIG.API_KEY}`
    },
    body: JSON.stringify({
      model: CONFIG.CHAT_MODEL,
      messages: messages,
      temperature: 0.7,
      max_tokens: 2000
    })
  });
  
  if (!response.ok) {
    throw new Error('API request failed');
  }
  
  return response.json();
}

// Embeddings API call
async createEmbedding(text: string): Promise<number[]> {
  const response = await fetch(CONFIG.EMBEDDING_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CONFIG.API_KEY}`
    },
    body: JSON.stringify({
      model: CONFIG.EMBEDDING_MODEL,
      input: text
    })
  });
  
  const data = await response.json();
  return data.data[0].embedding;
}
```

### Image Processing for Vision API
```typescript
async processImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Format for vision API
formatMessageWithImage(text: string, imageData: string): any {
  return {
    role: "user",
    content: [
      ...(text ? [{ type: "text", text: text }] : []),
      {
        type: "image_url",
        image_url: { url: imageData }
      }
    ]
  };
}
```

### RAG Implementation
```typescript
// Knowledge base for CV analysis
const CV_BEST_PRACTICES = [
  {
    id: 'contact_info',
    title: 'Contact Information',
    content: 'Always include full name, phone number, professional email, and LinkedIn profile.',
    category: 'structure'
  },
  {
    id: 'professional_summary',
    title: 'Professional Summary', 
    content: 'Write a compelling 2-3 sentence summary highlighting key skills and experience.',
    category: 'content'
  }
  // ... more practices
];

// Semantic search using embeddings
async findRelevantContext(query: string): Promise<string> {
  const queryEmbedding = await this.openAI.createEmbedding(query);
  
  // Find similar stored documents
  const similarities = [];
  const storedEmbeddings = this.storage.getEmbeddings();
  
  for (const [id, embedding] of storedEmbeddings) {
    const similarity = this.cosineSimilarity(queryEmbedding, embedding);
    similarities.push({ id, similarity });
  }
  
  // Return most relevant context
  const relevant = similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3);
    
  return this.buildContextString(relevant);
}
```

## 📦 Required Dependencies

### Package.json additions
```json
{
  "dependencies": {
    "pdfjs-dist": "^3.11.174",
    "marked": "^9.1.6"
  },
  "devDependencies": {
    "@types/marked": "^6.0.0"
  }
}
```

## 🎨 Styling Reference

### Use these CSS classes for consistency
```scss
// Main layout
.chat-container { /* Full height chat area */ }
.messages { /* Scrollable message area */ }
.input-area { /* Bottom input section */ }

// Messages
.message { /* Base message styling */ }
.message.user { /* User messages - right aligned, blue */ }
.message.assistant { /* AI messages - left aligned, gray */ }

// Attachments
.message-image { /* Image display in messages */ }
.message-file { /* File display in messages */ }
.attachment-preview { /* File preview in input */ }

// Buttons
.attach-btn { /* File/image attach buttons */ }
.send-btn { /* Send message button */ }
```

## 🚀 Feature Implementation Priority

### Phase 1: Core Chat (Week 1)
1. ✅ Basic Angular setup with routing
2. ✅ OpenAI API integration
3. ✅ Chat interface with message display
4. ✅ LocalStorage for chat history

### Phase 2: File Processing (Week 2)
1. ✅ PDF upload and text extraction
2. ✅ Image upload for vision API
3. ✅ File validation and error handling
4. ✅ Attachment preview in UI

### Phase 3: AI Features (Week 3)
1. ✅ Embeddings API integration
2. ✅ RAG system for context retrieval
3. ✅ CV analysis mode
4. ✅ Semantic search functionality

## 🔐 Security Considerations

### API Key Protection
```typescript
// Environment-based configuration
export const environment = {
  production: false,
  openaiApiKey: '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'
};

// Note: In production, consider using a proxy service to hide the API key
```

### File Upload Security
```typescript
// File validation
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'text/plain'
];

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

validateFile(file: File): boolean {
  return ALLOWED_FILE_TYPES.includes(file.type) && 
         file.size <= MAX_FILE_SIZE;
}
```

## 💡 Pro Tips for Implementation

### 1. Error Handling
```typescript
// Centralized error handling service
@Injectable()
export class ErrorHandlingService {
  handleApiError(error: any): string {
    if (error.status === 429) return 'Rate limit exceeded. Please wait.';
    if (error.status === 401) return 'Invalid API key.';
    return 'Something went wrong. Please try again.';
  }
}
```

### 2. Loading States
```typescript
// Show loading indicators for API calls
export class ChatComponent {
  isLoading = false;
  
  async sendMessage() {
    this.isLoading = true;
    try {
      // API call
    } finally {
      this.isLoading = false;
    }
  }
}
```

### 3. Performance Optimization
```typescript
// Lazy load PDF.js
async loadPdfJs() {
  if (!window['pdfjs']) {
    await import('pdfjs-dist');
  }
}

// Debounce embeddings creation
debounceCreateEmbedding = debounce(this.createEmbedding.bind(this), 1000);
```

## 🎯 Expected Outcomes

After implementation, your Angular chatbot will demonstrate:

1. ✅ **OpenAI Chat API** - Full conversational AI
2. ✅ **Vision API** - Image analysis and description  
3. ✅ **Embeddings API** - Semantic search and similarity
4. ✅ **RAG System** - Context-aware responses
5. ✅ **File Processing** - PDF text extraction and analysis
6. ✅ **Modern UI** - Professional Angular interface
7. ✅ **Data Persistence** - LocalStorage-based history

## 📚 Learning Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [PDF.js Documentation](https://mozilla.github.io/pdf.js/)
- [Angular File Upload Guide](https://angular.io/guide/file-upload)
- [Marked.js for Markdown](https://marked.js.org/)

---

**Ready to build!** This plan gives you everything needed to create a professional AI chatbot in Angular with minimal effort. Focus on one phase at a time and you'll have a impressive