import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AiConversation } from '../../Models/ai/ai-conversation';
import { AiMessage } from '../../Models/ai/ai-message';
import { CvAnalysis } from '../../Models/ai/cv-analysis';
import { AuthService } from '../auth.service';

@Injectable({
  providedIn: 'root'
})
export class AiStorageService {
  private conversationsSubject = new BehaviorSubject<AiConversation[]>([]);
  public conversations$ = this.conversationsSubject.asObservable();

  private readonly STORAGE_KEYS = {
    conversations: 'ai_conversations',
    analyses: 'cv_analyses'
  };

  constructor(private authService: AuthService) {
    this.loadConversations();
  }

  // Get all conversations for current user
  getConversations(): AiConversation[] {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return [];

    return this.conversationsSubject.value.filter(conv => conv.userId === userId);
  }

  // Get conversation by ID
  getConversation(conversationId: string): AiConversation | null {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return null;

    return this.conversationsSubject.value.find(
      conv => conv.id === conversationId && conv.userId === userId
    ) || null;
  }

  // Create new conversation
  createConversation(title: string, mode: 'general' | 'cv-analysis' | 'career-advice' = 'general'): AiConversation {
    const userId = this.authService.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const conversation: AiConversation = {
      id: this.generateId(),
      title,
      userId,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      mode
    };

    const conversations = this.conversationsSubject.value;
    conversations.push(conversation);
    this.conversationsSubject.next(conversations);
    this.saveConversations();

    return conversation;
  }

  // Add message to conversation
  addMessage(conversationId: string, message: Omit<AiMessage, 'id' | 'timestamp'>): AiMessage {
    const conversations = this.conversationsSubject.value;
    const conversation = conversations.find(conv => conv.id === conversationId);
    
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const newMessage: AiMessage = {
      ...message,
      id: this.generateId(),
      timestamp: new Date()
    };

    conversation.messages.push(newMessage);
    conversation.updatedAt = new Date();
    
    this.conversationsSubject.next(conversations);
    this.saveConversations();

    return newMessage;
  }

  // Update conversation title
  updateConversationTitle(conversationId: string, title: string): void {
    const conversations = this.conversationsSubject.value;
    const conversation = conversations.find(conv => conv.id === conversationId);
    
    if (conversation) {
      conversation.title = title;
      conversation.updatedAt = new Date();
      this.conversationsSubject.next(conversations);
      this.saveConversations();
    }
  }

  // Delete conversation
  deleteConversation(conversationId: string): void {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return;

    const conversations = this.conversationsSubject.value.filter(
      conv => !(conv.id === conversationId && conv.userId === userId)
    );
    
    this.conversationsSubject.next(conversations);
    this.saveConversations();
  }

  // Clear all conversations for current user
  clearUserConversations(): void {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return;

    const conversations = this.conversationsSubject.value.filter(
      conv => conv.userId !== userId
    );
    
    this.conversationsSubject.next(conversations);
    this.saveConversations();
  }

  // Save CV analysis
  saveCvAnalysis(analysis: CvAnalysis): void {
    const analyses = this.getCvAnalyses();
    analyses.push(analysis);
    localStorage.setItem(this.STORAGE_KEYS.analyses, JSON.stringify(analyses));
  }

  // Get CV analyses for current user
  getCvAnalyses(): CvAnalysis[] {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return [];

    const stored = localStorage.getItem(this.STORAGE_KEYS.analyses);
    if (!stored) return [];

    try {
      const all = JSON.parse(stored) as CvAnalysis[];
      return all.filter(analysis => {
        const conversation = this.getConversation(analysis.conversationId);
        return conversation?.userId === userId;
      });
    } catch {
      return [];
    }
  }

  // Get conversation statistics
  getConversationStats(): { total: number; byMode: { [key: string]: number } } {
    const conversations = this.getConversations();
    const byMode: { [key: string]: number } = {};
    
    conversations.forEach(conv => {
      byMode[conv.mode] = (byMode[conv.mode] || 0) + 1;
    });

    return {
      total: conversations.length,
      byMode
    };
  }

  private loadConversations(): void {
    const stored = localStorage.getItem(this.STORAGE_KEYS.conversations);
    if (stored) {
      try {
        const conversations = JSON.parse(stored).map((conv: any) => ({
          ...conv,
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        this.conversationsSubject.next(conversations);
      } catch (error) {
        console.error('Error loading conversations:', error);
        this.conversationsSubject.next([]);
      }
    }
  }

  private saveConversations(): void {
    const conversations = this.conversationsSubject.value;
    localStorage.setItem(this.STORAGE_KEYS.conversations, JSON.stringify(conversations));
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
