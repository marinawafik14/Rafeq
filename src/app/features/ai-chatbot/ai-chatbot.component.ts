import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { HttpClient } from '@angular/common/http';

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
  currentUserId: number | null = null;
  conversations: AiConversation[] = [];
  selectedConversation: AiConversation | null = null;
  isLoading = false;
  isProcessing = false;
  error: string | null = null;

  // UI state
  showConversationList = true;
  activeMode: 'general' | 'cv-analysis' | 'career-advice' = 'general';
  showCvAnalysis = false;
  public showSuggestions = true; 

  // Track if user is at the bottom of the messages container
  isUserAtBottom: boolean = true;

  // Voice output state
  voiceOutputEnabled: boolean = false;
  ttsVoice: string = 'alloy'; // default voice
  private ttsAudioCache: { [messageId: string]: string } = {};

  // Gemini API fallback configuration
  private geminiApiKey = 'AIzaSyCXCEVKyungnaXWR0edBNCjALQ0eQqHpcs';
  private geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
  private geminiModels = ['gemini-2.5-flash', 'gemini-2.0-flash']; // Try 2.5 first, then 2.0

  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private openaiService: OpenaiService,
    private storageService: AiStorageService,
    private fileProcessingService: FileProcessingService,
    private ragService: RagService,
    private router: Router,
    private http: HttpClient // <-- Add HttpClient for TTS API
  ) {}

  ngOnInit(): void {
    this.initializeComponent();
    // Load voice output preference from localStorage
    const stored = localStorage.getItem('ai_voice_output');
    this.voiceOutputEnabled = stored === 'true';
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  ngAfterViewChecked(): void {
    // Only scroll to bottom if user is at the bottom
    if (this.isUserAtBottom) {
      this.scrollToBottom();
    }
  }

  // Add a scroll event handler for the messages container
  onMessagesScroll(): void {
    if (!this.messagesContainer) return;
    const element = this.messagesContainer.nativeElement;
    // Allow a small threshold for 'at bottom' (e.g., 20px)
    const threshold = 20;
    this.isUserAtBottom = (element.scrollHeight - element.scrollTop - element.clientHeight) < threshold;
  }

  private initializeComponent(): void {
    // Simple authentication check using existing AuthService methods
    this.currentUser = this.authService.currentUserValue;
    
    console.log('🔑 AI Chatbot Auth Check:', {
      currentUser: this.currentUser,
      hasAccessToken: !!(this.currentUser?.accessToken),
      isLoggedIn: this.authService.isLoggedIn()
    });

    // Simple check - if no current user or not logged in, redirect
    if (!this.currentUser || !this.authService.isLoggedIn()) {
      console.warn('❌ User not authenticated, redirecting to login');
      this.router.navigate(['/login']);
      return;
    }

    // Get user ID for storage
    this.currentUserId = this.authService.getCurrentUserId();

    // Load conversations
    this.loadConversations();

    // Subscribe to auth changes - if user logs out, redirect
    const authSub = this.authService.currentUser.subscribe(user => {
      if (!user) {
        console.warn('❌ User logged out, redirecting to login');
        this.router.navigate(['/login']);
      }
    });
    this.subscriptions.push(authSub);

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

  // Simplified authentication check
  private checkAuthentication(): boolean {
    if (!this.authService.isLoggedIn()) {
      console.warn('❌ Authentication check failed, redirecting to login');
      this.router.navigate(['/login']);
      return false;
    }
    return true;
  }

  // Conversation Management
  createNewConversation(mode: 'general' | 'cv-analysis' | 'career-advice' = 'general'): void {
    if (!this.checkAuthentication()) return;

    try {
      const title = this.generateConversationTitle(mode);
      const conversation = this.storageService.createConversation(title, mode);
      this.selectedConversation = conversation;
      this.activeMode = mode;
      this.showCvAnalysis = mode === 'cv-analysis';
      
      // Add welcome message
      this.addWelcomeMessage(mode);
    } catch (error) {
      console.error('Error creating conversation:', error);
      this.error = 'Failed to create new conversation.';
    }
  }

  selectConversation(conversation: AiConversation): void {
    if (!this.checkAuthentication()) return;

    this.selectedConversation = conversation;
    this.activeMode = conversation.mode;
    this.showCvAnalysis = conversation.mode === 'cv-analysis';
  }

  deleteConversation(conversationId: string): void {
    if (!this.checkAuthentication()) return;

    Swal.fire({
      title: 'Delete Conversation?',
      text: 'This conversation and all its messages will be permanently deleted.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0a2e65', // Your site's blue color
      cancelButtonColor: '#6c757d',
      confirmButtonText: '<i class="fas fa-trash me-2"></i>Yes, Delete',
      cancelButtonText: '<i class="fas fa-times me-2"></i>Cancel',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-4',
        confirmButton: 'rounded-pill px-4',
        cancelButton: 'rounded-pill px-4'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        // Show loading
        Swal.fire({
          title: 'Deleting...',
          text: 'Please wait while we delete your conversation.',
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        try {
          // Delete the conversation
          this.storageService.deleteConversation(conversationId);
          
          // Update selected conversation
          if (this.selectedConversation?.id === conversationId) {
            this.selectedConversation = this.conversations[0] || null;
            if (!this.selectedConversation) {
              this.createNewConversation();
            }
          }

          // Show success message
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'Conversation has been deleted successfully.',
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end',
            customClass: {
              popup: 'rounded-3'
            }
          });

        } catch (error) {
          console.error('Error deleting conversation:', error);
          Swal.fire({
            icon: 'error',
            title: 'Delete Failed',
            text: 'Failed to delete conversation. Please try again.',
            confirmButtonColor: '#0a2e65',
            customClass: {
              popup: 'rounded-4',
              confirmButton: 'rounded-pill px-4'
            }
          });
        }
      }
    });
  }

  clearAllConversations(): void {
    if (!this.checkAuthentication()) return;

    if (confirm('Are you sure you want to clear all conversations? This action cannot be undone.')) {
      this.storageService.clearUserConversations();
      this.ragService.clearUserDocuments();
      this.createNewConversation();
    }
  }

  // Message handling
  async onMessageSent(content: string): Promise<void> {
    if (!this.selectedConversation || this.isProcessing) return;
    
    // Check authentication before processing message
    if (!this.checkAuthentication()) return;

    this.isProcessing = true;
    this.error = null;

    try {
      console.log('💬 Processing message:', content);

      // Add user message
      const userMessage = this.storageService.addMessage(this.selectedConversation.id, {
        content,
        role: 'user'
      });
      if (this.isUserAtBottom) {
        setTimeout(() => this.scrollToBottom(), 0);
      }

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
      const aiMsg = this.storageService.addMessage(this.selectedConversation.id, {
        content: aiResponse,
        role: 'assistant',
        metadata: {
          model: 'gpt-4o-mini',
          processingTime: Date.now()
        }
      });
      if (this.isUserAtBottom) {
        setTimeout(() => this.scrollToBottom(), 0);
      }
      // TTS: If enabled, call TTS API and cache audio URL
      if (this.voiceOutputEnabled && aiMsg && aiMsg.id && aiResponse) {
        await this.generateTtsForMessage(aiMsg.id, aiResponse);
      }

      console.log('✅ Message processed successfully');

    } catch (error) {
      console.error('❌ Error processing message:', error);
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
    
    // Check authentication before processing file
    if (!this.checkAuthentication()) return;

    try {
      console.log('📁 Processing file:', file.fileName);

      // Add file message
      const fileMessage = this.storageService.addMessage(this.selectedConversation.id, {
        content: `Uploaded file: ${file.fileName}`,
        role: 'user',
        attachments: [file]
      });
      if (this.isUserAtBottom) {
        setTimeout(() => this.scrollToBottom(), 0);
      }

      // Process file based on type
      if (file.fileType === 'application/pdf' && file.content) {
        await this.processCvFile(file);
      } else if (file.fileType.startsWith('image/') && file.base64Data) {
        await this.processImageFile(file);
      }

      console.log('✅ File processed successfully');

    } catch (error) {
      console.error('❌ Error processing file:', error);
      this.error = 'Failed to process the uploaded file.';
    }
  }

  // Mode switching
  switchMode(mode: 'general' | 'cv-analysis' | 'career-advice'): void {
    if (!this.checkAuthentication()) return;

    this.activeMode = mode;
    this.showCvAnalysis = mode === 'cv-analysis';
    this.createNewConversation(mode);
  }

  // UI
  toggleConversationList(): void {
    this.showConversationList = !this.showConversationList;
  }

  toggleSuggestions(): void {
    this.showSuggestions = !this.showSuggestions;
  }

  toggleVoiceOutput(): void {
    this.voiceOutputEnabled = !this.voiceOutputEnabled;
    localStorage.setItem('ai_voice_output', this.voiceOutputEnabled ? 'true' : 'false');
  }

  /**
   * Handles sending a suggestion message when a user clicks on a suggestion chip or card
   * @param suggestion The text of the suggestion to send
   */
  sendSuggestion(suggestion: string): void {
    if (!this.selectedConversation || this.isProcessing) return;
    
    // Process the suggestion as a regular message
    this.onMessageSent(suggestion);
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
    try {
      const response = await this.openaiService.sendChatMessage([
        { role: 'user', content }
      ], 'You are a helpful AI assistant specializing in career guidance and professional development.').toPromise();
      return response || 'Unable to process your request.';
    } catch (error) {
      console.error('Error in general message handling:', error);
      // Try Gemini fallback
      return await this.tryGeminiFallback(content, 'general');
    }
  }

  private async handleCareerAdviceMessage(content: string): Promise<string> {
    try {
      return await this.ragService.getContextualCareerAdvice(content);
    } catch (error) {
      console.error('Error in career advice handling:', error);
      // Try Gemini fallback
      return await this.tryGeminiFallback(content, 'career-advice');
    }
  }

  private async handleCvAnalysisMessage(content: string): Promise<string> {
    try {
      const response = await this.openaiService.analyzeCVContent(content).toPromise();
      return response || 'Unable to analyze the CV content.';
    } catch (error) {
      console.error('Error in CV analysis handling:', error);
      // Try Gemini fallback
      return await this.tryGeminiFallback(content, 'cv-analysis');
    }
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

  // Generate TTS audio for a message and cache the URL
  async generateTtsForMessage(messageId: string, text: string): Promise<void> {
    if (this.ttsAudioCache[messageId]) return; // Already cached
    try {
      const ttsRes: any = await this.http.post('/api/tts/generate', {
        text,
        voice: this.ttsVoice
      }).toPromise();
      if (ttsRes && ttsRes.audioUrl) {
        this.ttsAudioCache[messageId] = ttsRes.audioUrl;
        // Optionally, store in message metadata for access in ai-message.component
        const msg = this.selectedConversation?.messages.find(m => m.id === messageId);
        if (msg) {
          msg.metadata = msg.metadata || {};
          (msg.metadata as any).ttsAudioUrl = ttsRes.audioUrl; // Cast to any to avoid linter error
        }
      }
    } catch (err) {
      console.error('TTS generation failed:', err);
    }
  }

  // Gemini API fallback method
  private async tryGeminiFallback(content: string, mode: string): Promise<string> {
    const systemPrompt = this.getSystemPromptForMode(mode);
    
    for (const model of this.geminiModels) {
      try {
        console.log(`🔄 Trying Gemini fallback with model: ${model}`);
        
        const response = await this.http.post(
          `${this.geminiApiUrl}/${model}:generateContent?key=${this.geminiApiKey}`,
          {
            contents: [
              {
                parts: [
                  { text: systemPrompt },
                  { text: content }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048,
            }
          }
        ).toPromise() as any;

        if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
          console.log(`✅ Gemini fallback successful with ${model}`);
          return response.candidates[0].content.parts[0].text;
        }
      } catch (error) {
        console.error(`❌ Gemini fallback failed with ${model}:`, error);
        continue; // Try next model
      }
    }
    
    // If all Gemini models fail, return a generic error message
    console.error('❌ All AI services failed');
    return 'I apologize, but I\'m currently experiencing technical difficulties. Please try again later.';
  }

  // Get appropriate system prompt based on mode
  private getSystemPromptForMode(mode: string): string {
    switch (mode) {
      case 'cv-analysis':
        return 'You are an expert CV/resume reviewer and career advisor. Analyze the provided CV content and provide detailed, constructive feedback on format, content, strengths, weaknesses, and suggestions for improvement. Be specific and actionable in your recommendations.';
      case 'career-advice':
        return 'You are a professional career advisor with extensive experience in career development, job searching, and professional growth. Provide personalized, practical career advice based on the user\'s query. Focus on actionable steps and industry best practices.';
      default:
        return 'You are a helpful AI assistant specializing in career guidance and professional development. Provide informative, supportive, and practical advice to help users advance their careers and achieve their professional goals.';
    }
  }
}
