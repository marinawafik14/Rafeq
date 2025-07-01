import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService } from '../../Services/auth.service';
import { OpenaiService } from '../../Services/ai/openai.service';
import { AiStorageService } from '../../Services/ai/ai-storage.service';
import { FileProcessingService } from '../../Services/ai/file-processing.service';
import { RagService } from '../../Services/ai/rag.service';

import { AiConversation } from '../../Models/ai/ai-conversation';
import { AiMessage } from '../../Models/ai/ai-message';
import { FileAttachment } from '../../Models/ai/file-attachment';
import { CvAnalysis } from '../../Models/ai/cv-analysis';

import { AiMessageComponent } from './components/ai-message/ai-message.component';
import { AiInputAreaComponent } from './components/ai-input-area/ai-input-area.component';
import { CvAnalysisComponent } from './components/cv-analysis/cv-analysis.component';

@Component({
  selector: 'app-ai-chatbot',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    AiMessageComponent, 
    AiInputAreaComponent, 
    CvAnalysisComponent
  ],
  templateUrl: './ai-chatbot.component.html',
  styleUrl: './ai-chatbot.component.css'
})
export class AiChatbotComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  // Component state
  currentUser: any = null;
  conversations: AiConversation[] = [];
  selectedConversation: AiConversation | null = null;
  isLoading = false;
  isProcessing = false;
  error: string | null = null;

  // UI state
  showConversationList = true;
  activeMode: 'general' | 'cv-analysis' | 'career-advice' = 'general';
  showCvAnalysis = false;

  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private openaiService: OpenaiService,
    private storageService: AiStorageService,
    private fileProcessingService: FileProcessingService,
    private ragService: RagService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  private initializeComponent(): void {
    // Check authentication
    this.currentUser = this.authService.currentUserValue;
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    // Load conversations
    this.loadConversations();

    // Subscribe to conversation updates
    const convSub = this.storageService.conversations$.subscribe(conversations => {
      this.conversations = conversations;
    });
    this.subscriptions.push(convSub);

    // Create initial conversation if none exist
    if (this.conversations.length === 0) {
      this.createNewConversation();
    } else {
      this.selectedConversation = this.conversations[0];
    }
  }

  private loadConversations(): void {
    this.conversations = this.storageService.getConversations();
  }

  // Conversation Management
  createNewConversation(mode: 'general' | 'cv-analysis' | 'career-advice' = 'general'): void {
    const title = this.generateConversationTitle(mode);
    const conversation = this.storageService.createConversation(title, mode);
    this.selectedConversation = conversation;
    this.activeMode = mode;
    this.showCvAnalysis = mode === 'cv-analysis';
    
    // Add welcome message
    this.addWelcomeMessage(mode);
  }

  selectConversation(conversation: AiConversation): void {
    this.selectedConversation = conversation;
    this.activeMode = conversation.mode;
    this.showCvAnalysis = conversation.mode === 'cv-analysis';
  }

  deleteConversation(conversationId: string): void {
    if (confirm('Are you sure you want to delete this conversation?')) {
      this.storageService.deleteConversation(conversationId);
      if (this.selectedConversation?.id === conversationId) {
        this.selectedConversation = this.conversations[0] || null;
        if (!this.selectedConversation) {
          this.createNewConversation();
        }
      }
    }
  }

  clearAllConversations(): void {
    if (confirm('Are you sure you want to clear all conversations? This action cannot be undone.')) {
      this.storageService.clearUserConversations();
      this.ragService.clearUserDocuments();
      this.createNewConversation();
    }
  }

  // Message handling
  async onMessageSent(content: string): Promise<void> {
    if (!this.selectedConversation || this.isProcessing) return;

    this.isProcessing = true;
    this.error = null;

    try {
      // Add user message
      const userMessage = this.storageService.addMessage(this.selectedConversation.id, {
        content,
        role: 'user'
      });

      // Generate AI response based on conversation mode
      let aiResponse: string;
      switch (this.activeMode) {
        case 'cv-analysis':
          aiResponse = await this.handleCvAnalysisMessage(content);
          break;
        case 'career-advice':
          aiResponse = await this.handleCareerAdviceMessage(content);
          break;
        default:
          aiResponse = await this.handleGeneralMessage(content);
      }

      // Add AI response
      this.storageService.addMessage(this.selectedConversation.id, {
        content: aiResponse,
        role: 'assistant',
        metadata: {
          model: 'gpt-4o-mini',
          processingTime: Date.now()
        }
      });

    } catch (error) {
      console.error('Error processing message:', error);
      this.error = 'Failed to process your message. Please try again.';
      
      // Add error message
      this.storageService.addMessage(this.selectedConversation.id, {
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        role: 'assistant'
      });
    } finally {
      this.isProcessing = false;
    }
  }

  // File handling
  async onFileUploaded(file: FileAttachment): Promise<void> {
    if (!this.selectedConversation) return;

    try {
      // Add file message
      const fileMessage = this.storageService.addMessage(this.selectedConversation.id, {
        content: `Uploaded file: ${file.fileName}`,
        role: 'user',
        attachments: [file]
      });

      // Process file based on type
      if (file.fileType === 'application/pdf' && file.content) {
        await this.processCvFile(file);
      } else if (file.fileType.startsWith('image/') && file.base64Data) {
        await this.processImageFile(file);
      }

    } catch (error) {
      console.error('Error processing file:', error);
      this.error = 'Failed to process the uploaded file.';
    }
  }

  private async processCvFile(file: FileAttachment): Promise<void> {
    if (!this.selectedConversation || !file.content) return;

    this.isProcessing = true;

    try {
      // Add CV content to RAG system
      await this.ragService.addDocument(file.content, file.fileName, 'cv');

      // Generate CV analysis
      const analysis = await this.ragService.analyzeCVWithRAG(file.content);

      // Add analysis message
      this.storageService.addMessage(this.selectedConversation.id, {
        content: analysis,
        role: 'assistant',
        metadata: {
          model: 'gpt-4o-mini',
          processingTime: Date.now()
        }
      });

      // Save CV analysis
      const cvAnalysis: CvAnalysis = {
        id: this.generateId(),
        conversationId: this.selectedConversation.id,
        fileId: file.id,
        analysis: {
          overallScore: this.extractScoreFromAnalysis(analysis),
          strengths: [],
          weaknesses: [],
          suggestions: [],
          sections: {}
        },
        createdAt: new Date()
      };

      this.storageService.saveCvAnalysis(cvAnalysis);

    } catch (error) {
      console.error('Error analyzing CV:', error);
      this.storageService.addMessage(this.selectedConversation.id, {
        content: 'I encountered an error while analyzing your CV. Please try uploading it again.',
        role: 'assistant'
      });
    } finally {
      this.isProcessing = false;
    }
  }

  private async processImageFile(file: FileAttachment): Promise<void> {
    if (!this.selectedConversation || !file.base64Data) return;

    this.isProcessing = true;

    try {
      const prompt = this.activeMode === 'cv-analysis' 
        ? "Analyze this CV image and provide detailed feedback on format, content, and suggestions for improvement."
        : "Describe what you see in this image and provide relevant insights.";

      const analysis = await this.openaiService.analyzeImage(file.base64Data, prompt).toPromise();

      this.storageService.addMessage(this.selectedConversation.id, {
        content: analysis || 'Unable to analyze the image.',
        role: 'assistant',
        metadata: {
          model: 'gpt-4-vision-preview',
          processingTime: Date.now()
        }
      });

    } catch (error) {
      console.error('Error analyzing image:', error);
      this.storageService.addMessage(this.selectedConversation.id, {
        content: 'I encountered an error while analyzing the image. Please try again.',
        role: 'assistant'
      });
    } finally {
      this.isProcessing = false;
    }
  }

  // Message type handlers
  private async handleGeneralMessage(content: string): Promise<string> {
    return await this.openaiService.sendChatMessage([
      { role: 'user', content }
    ], 'You are a helpful AI assistant specializing in career guidance and professional development.').toPromise() || 'Unable to process your request.';
  }

  private async handleCareerAdviceMessage(content: string): Promise<string> {
    return await this.ragService.getContextualCareerAdvice(content);
  }

  private async handleCvAnalysisMessage(content: string): Promise<string> {
    return await this.openaiService.analyzeCVContent(content).toPromise() || 'Unable to analyze the CV content.';
  }

  // Mode switching
  switchMode(mode: 'general' | 'cv-analysis' | 'career-advice'): void {
    this.activeMode = mode;
    this.showCvAnalysis = mode === 'cv-analysis';
    this.createNewConversation(mode);
  }

  // UI helpers
  toggleConversationList(): void {
    this.showConversationList = !this.showConversationList;
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  private addWelcomeMessage(mode: 'general' | 'cv-analysis' | 'career-advice'): void {
    if (!this.selectedConversation) return;

    const welcomeMessages = {
      general: 'Hello! I\'m your AI career assistant. How can I help you today?',
      'cv-analysis': 'Welcome to CV Analysis! Upload your resume and I\'ll provide detailed feedback to help you improve it.',
      'career-advice': 'Hi! I\'m here to provide personalized career advice. What would you like to know about your career path?'
    };

    this.storageService.addMessage(this.selectedConversation.id, {
      content: welcomeMessages[mode],
      role: 'assistant'
    });
  }

  private generateConversationTitle(mode: string): string {
    const prefixes = {
      general: 'Chat',
      'cv-analysis': 'CV Review',
      'career-advice': 'Career Advice'
    };
    
    const timestamp = new Date().toLocaleDateString();
    return `${prefixes[mode as keyof typeof prefixes]} - ${timestamp}`;
  }

  private extractScoreFromAnalysis(analysis: string): number {
    const scoreMatch = analysis.match(/(?:score|rating)[\s:]*(\d+)(?:\/100|\%)/i);
    return scoreMatch ? parseInt(scoreMatch[1]) : 75;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Track by functions for *ngFor optimization
  trackByConversationId(index: number, conversation: AiConversation): string {
    return conversation.id;
  }

  trackByMessageId(index: number, message: AiMessage): string {
    return message.id;
  }

  // Get last message preview for conversation list
  getLastMessagePreview(conversation: AiConversation): string {
    if (conversation.messages.length === 0) return 'No messages yet...';
    
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    const preview = lastMessage.content.substring(0, 50);
    return preview.length < lastMessage.content.length ? preview + '...' : preview;
  }

  // Get CV analysis data for the panel
  getCvAnalysisData(): any {
    if (!this.selectedConversation) return null;
    
    const analyses = this.storageService.getCvAnalyses();
    return analyses.find(analysis => analysis.conversationId === this.selectedConversation!.id);
  }

  // Getters for template
  get currentMessages(): AiMessage[] {
    return this.selectedConversation?.messages || [];
  }

  get conversationStats() {
    return this.storageService.getConversationStats();
  }

  get documentStats() {
    return this.ragService.getUserDocumentStats();
  }
}
