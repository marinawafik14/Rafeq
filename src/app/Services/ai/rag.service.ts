import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { OpenaiService } from './openai.service';
import { AiStorageService } from './ai-storage.service';
import { AuthService } from '../auth.service';

interface DocumentChunk {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    source: string;
    type: 'cv' | 'conversation' | 'knowledge';
    timestamp: Date;
    userId: number;
  };
}

interface RAGResult {
  answer: string;
  sources: string[];
  confidence: number;
}

@Injectable({
  providedIn: 'root'
})
export class RagService {
  private readonly STORAGE_KEY = 'rag_documents';
  private readonly SIMILARITY_THRESHOLD = 0.7;
  private readonly MAX_CONTEXT_LENGTH = 4000;

  constructor(
    private openaiService: OpenaiService,
    private storageService: AiStorageService,
    private authService: AuthService
  ) {}

  // Add document to RAG knowledge base
  async addDocument(content: string, source: string, type: 'cv' | 'conversation' | 'knowledge'): Promise<void> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    try {
      // Split content into chunks
      const chunks = this.splitIntoChunks(content);
      const documents: DocumentChunk[] = [];

      for (const chunk of chunks) {
        // Generate embedding for each chunk
        const embedding = await this.openaiService.generateEmbedding(chunk).toPromise();
        
        const document: DocumentChunk = {
          id: this.generateId(),
          content: chunk,
          embedding: embedding || [],
          metadata: {
            source,
            type,
            timestamp: new Date(),
            userId
          }
        };
        
        documents.push(document);
      }

      // Store documents
      this.storeDocuments(documents);
    } catch (error) {
      console.error('Error adding document to RAG:', error);
      throw error;
    }
  }

  // Query RAG system
  queryRAG(question: string, context?: string): Observable<RAGResult> {
    return from(this.performRAGQuery(question, context));
  }

  private async performRAGQuery(question: string, context?: string): Promise<RAGResult> {
    try {
      // Generate embedding for the question
      const questionEmbedding = await this.openaiService.generateEmbedding(question).toPromise();
      if (!questionEmbedding) throw new Error('Failed to generate question embedding');

      // Find relevant documents
      const relevantDocs = this.findSimilarDocuments(questionEmbedding);
      
      // Build context from relevant documents
      const ragContext = this.buildContext(relevantDocs);
      
      // Generate answer with RAG context
      const systemPrompt = `You are an AI assistant with access to relevant context information. 
      Use the provided context to answer questions accurately. If the context doesn't contain 
      relevant information, clearly state that you don't have enough information to answer.
      
      Context: ${ragContext}
      ${context ? `Additional context: ${context}` : ''}`;

      const answer = await this.openaiService.sendChatMessage([
        { role: 'user', content: question }
      ], systemPrompt).toPromise();

      return {
        answer: answer || 'I apologize, but I cannot generate an answer at this time.',
        sources: relevantDocs.map(doc => doc.metadata.source),
        confidence: this.calculateConfidence(relevantDocs, questionEmbedding)
      };
    } catch (error) {
      console.error('RAG query error:', error);
      return {
        answer: 'I encountered an error while processing your question. Please try again.',
        sources: [],
        confidence: 0
      };
    }
  }

  // Enhanced CV analysis with RAG
  async analyzeCVWithRAG(cvContent: string, userProfile?: any): Promise<string> {
    // Add CV to knowledge base
    await this.addDocument(cvContent, 'uploaded_cv', 'cv');

    // Build context from user's previous conversations and analyses
    const conversations = this.storageService.getConversations();
    let conversationContext = '';
    
    conversations.slice(-3).forEach(conv => {
      conv.messages.forEach(msg => {
        if (msg.role === 'assistant' && msg.content.includes('CV') || msg.content.includes('resume')) {
          conversationContext += msg.content + '\n';
        }
      });
    });

    const enhancedPrompt = `Analyze this CV comprehensively with context from previous discussions:

    CV Content: ${cvContent}
    
    Previous CV discussions: ${conversationContext}
    
    ${userProfile ? `User Profile: ${JSON.stringify(userProfile)}` : ''}
    
    Provide detailed feedback including:
    1. Overall assessment and score (1-100)
    2. Strengths and areas for improvement
    3. ATS optimization suggestions
    4. Industry-specific recommendations
    5. Comparison with previous versions (if applicable)
    6. Action items for improvement`;

    return await this.openaiService.sendChatMessage([
      { role: 'user', content: enhancedPrompt }
    ]).toPromise() || 'Analysis could not be completed.';
  }

  // Career advice with context
  async getContextualCareerAdvice(question: string): Promise<string> {
    // Get user's CV content and conversation history for context
    const conversations = this.storageService.getConversations();
    const cvAnalyses = this.storageService.getCvAnalyses();
    
    let userContext = 'Previous conversations and CV insights:\n';
    
    // Add recent conversation context
    conversations.slice(-2).forEach(conv => {
      userContext += `- ${conv.title}: ${conv.messages.slice(-2).map(m => m.content).join(' ')}\n`;
    });

    // Add CV analysis insights
    cvAnalyses.slice(-1).forEach(analysis => {
      userContext += `- Recent CV feedback: ${JSON.stringify(analysis.analysis)}\n`;
    });

    return this.queryRAG(question, userContext).toPromise().then(result => result.answer);
  }

  // Clear user's RAG documents
  clearUserDocuments(): void {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return;

    const allDocs = this.loadDocuments();
    const filteredDocs = allDocs.filter(doc => doc.metadata.userId !== userId);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredDocs));
  }

  // Get user's document statistics
  getUserDocumentStats(): { total: number; byType: { [key: string]: number } } {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return { total: 0, byType: {} };

    const userDocs = this.loadDocuments().filter(doc => doc.metadata.userId === userId);
    const byType: { [key: string]: number } = {};
    
    userDocs.forEach(doc => {
      byType[doc.metadata.type] = (byType[doc.metadata.type] || 0) + 1;
    });

    return {
      total: userDocs.length,
      byType
    };
  }

  private splitIntoChunks(text: string, maxChunkSize: number = 500): string[] {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? '. ' : '') + sentence;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  private findSimilarDocuments(queryEmbedding: number[], limit: number = 5): DocumentChunk[] {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return [];

    const userDocs = this.loadDocuments().filter(doc => doc.metadata.userId === userId);
    
    const similarities = userDocs.map(doc => ({
      document: doc,
      similarity: this.cosineSimilarity(queryEmbedding, doc.embedding)
    }));

    return similarities
      .filter(item => item.similarity > this.SIMILARITY_THRESHOLD)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(item => item.document);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private buildContext(documents: DocumentChunk[]): string {
    let context = '';
    let currentLength = 0;

    for (const doc of documents) {
      if (currentLength + doc.content.length > this.MAX_CONTEXT_LENGTH) break;
      context += doc.content + '\n\n';
      currentLength += doc.content.length;
    }

    return context.trim();
  }

  private calculateConfidence(documents: DocumentChunk[], queryEmbedding: number[]): number {
    if (documents.length === 0) return 0;

    const similarities = documents.map(doc => 
      this.cosineSimilarity(queryEmbedding, doc.embedding)
    );

    const averageSimilarity = similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length;
    return Math.min(averageSimilarity * 100, 100);
  }

  private storeDocuments(documents: DocumentChunk[]): void {
    const existingDocs = this.loadDocuments();
    const updatedDocs = [...existingDocs, ...documents];
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedDocs));
  }

  private loadDocuments(): DocumentChunk[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return [];

    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
