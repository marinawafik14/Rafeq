import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FileProcessingService } from '../../../../Services/ai/file-processing.service';
import { FileAttachment } from '../../../../Models/ai/file-attachment';

@Component({
  selector: 'app-ai-input-area',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-input-area.component.html',
  styleUrl: './ai-input-area.component.css'
})
export class AiInputAreaComponent implements OnInit {
  @Input() disabled = false;
  @Input() mode: 'general' | 'cv-analysis' | 'career-advice' = 'general';
  @Output() messageSent = new EventEmitter<string>();
  @Output() fileUploaded = new EventEmitter<FileAttachment>();

  @ViewChild('messageInput') messageInput!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // Component state
  messageText = '';
  selectedFiles: File[] = [];
  isUploading = false;
  uploadProgress = 0;
  dragActive = false;

  // Suggestions based on mode
  suggestions: string[] = [];

  constructor(private fileProcessingService: FileProcessingService) {}

  ngOnInit(): void {
    this.updateSuggestions();
  }

  ngOnChanges(): void {
    this.updateSuggestions();
  }

  // Update suggestions based on mode
  private updateSuggestions(): void {
    switch (this.mode) {
      case 'cv-analysis':
        this.suggestions = [
          "Analyze my CV and provide feedback",
          "How can I improve my resume format?",
          "Check my CV for ATS optimization",
          "What skills should I highlight more?",
          "Review my work experience section"
        ];
        break;
      case 'career-advice':
        this.suggestions = [
          "What career path should I consider?",
          "How do I transition to a new industry?",
          "What skills are in demand in my field?",
          "How can I negotiate a better salary?",
          "Tips for networking effectively"
        ];
        break;
      default:
        this.suggestions = [
          "Help me prepare for an interview",
          "What are the latest industry trends?",
          "How do I build a professional network?",
          "Career development advice",
          "Work-life balance tips"
        ];
    }
  }

  // Handle message sending
  onSendMessage(): void {
    if (this.canSendMessage()) {
      const message = this.messageText.trim();
      this.messageSent.emit(message);
      this.messageText = '';
      this.autoResizeTextarea();
    }
  }

  // Handle Enter key press
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      if (event.shiftKey) {
        // Allow line break with Shift+Enter
        return;
      } else {
        // Send message with Enter
        event.preventDefault();
        this.onSendMessage();
      }
    }
  }

  // Handle suggestion click
  onSuggestionClick(suggestion: string): void {
    this.messageText = suggestion;
    this.focusInput();
    this.autoResizeTextarea();
  }

  // Check if message can be sent
  canSendMessage(): boolean {
    return !this.disabled && 
           (this.messageText.trim().length > 0 || this.selectedFiles.length > 0);
  }

  // Focus the input
  focusInput(): void {
    if (this.messageInput) {
      this.messageInput.nativeElement.focus();
    }
  }

  // Auto-resize textarea
  autoResizeTextarea(): void {
    if (this.messageInput) {
      const textarea = this.messageInput.nativeElement;
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }

  // File handling
  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(Array.from(input.files));
    }
  }

  onFileButtonClick(): void {
    this.fileInput.nativeElement.click();
  }

  private async handleFiles(files: File[]): Promise<void> {
    this.isUploading = true;
    this.uploadProgress = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        // Update progress
        this.uploadProgress = Math.round(((i + 0.5) / files.length) * 100);

        // Process file
        const processedFile = await this.fileProcessingService.processFile(file).toPromise();
        
        if (processedFile) {
          this.fileUploaded.emit(processedFile);
          this.selectedFiles.push(file);
        }

        // Update progress
        this.uploadProgress = Math.round(((i + 1) / files.length) * 100);
        
      } catch (error) {
        console.error('Error processing file:', error);
        // Could emit error event here
      }
    }

    // Reset state
    setTimeout(() => {
      this.isUploading = false;
      this.uploadProgress = 0;
      this.selectedFiles = [];
      if (this.fileInput) {
        this.fileInput.nativeElement.value = '';
      }
    }, 1000);
  }

  // Drag and drop handling
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragActive = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragActive = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragActive = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFiles(Array.from(files));
    }
  }

  // Get placeholder text based on mode
  get placeholderText(): string {
    switch (this.mode) {
      case 'cv-analysis':
        return 'Upload your CV or ask for resume advice...';
      case 'career-advice':
        return 'Ask for career guidance and professional advice...';
      default:
        return 'Type your message or ask me anything...';
    }
  }

  // Get file upload text based on mode
  get fileUploadText(): string {
    switch (this.mode) {
      case 'cv-analysis':
        return 'Upload CV (PDF, DOC, or Image)';
      case 'career-advice':
        return 'Upload Documents';
      default:
        return 'Attach Files';
    }
  }

  // Get accepted file types
  get acceptedFileTypes(): string {
    switch (this.mode) {
      case 'cv-analysis':
        return '.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp';
      default:
        return '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp';
    }
  }

  // Clear message
  clearMessage(): void {
    this.messageText = '';
    this.autoResizeTextarea();
    this.focusInput();
  }

  // Get character count
  get characterCount(): number {
    return this.messageText.length;
  }

  // Check if approaching limit
  get isApproachingLimit(): boolean {
    return this.characterCount > 4000; // Assuming 5000 char limit
  }

  // Get remaining characters
  get remainingCharacters(): number {
    return Math.max(0, 5000 - this.characterCount);
  }

  // Quick actions based on mode
  get quickActions(): Array<{icon: string, text: string, action: string}> {
    switch (this.mode) {
      case 'cv-analysis':
        return [
          { icon: 'fas fa-upload', text: 'Upload CV', action: 'upload' },
          { icon: 'fas fa-search', text: 'Review Format', action: 'format' },
          { icon: 'fas fa-chart-line', text: 'ATS Check', action: 'ats' }
        ];
      case 'career-advice':
        return [
          { icon: 'fas fa-lightbulb', text: 'Career Path', action: 'path' },
          { icon: 'fas fa-money-bill-wave', text: 'Salary Tips', action: 'salary' },
          { icon: 'fas fa-network-wired', text: 'Networking', action: 'network' }
        ];
      default:
        return [
          { icon: 'fas fa-briefcase', text: 'Interview Prep', action: 'interview' },
          { icon: 'fas fa-graduation-cap', text: 'Skills', action: 'skills' },
          { icon: 'fas fa-rocket', text: 'Growth', action: 'growth' }
        ];
    }
  }

  // Handle quick action click
  onQuickActionClick(action: string): void {
    const actionMessages: {[key: string]: string} = {
      upload: 'Please analyze my uploaded CV and provide detailed feedback.',
      format: 'How can I improve the format and layout of my CV?',
      ats: 'Check my CV for ATS optimization and keyword suggestions.',
      path: 'What career paths would you recommend based on my background?',
      salary: 'How can I negotiate a better salary in my current role?',
      network: 'What are the best strategies for professional networking?',
      interview: 'Help me prepare for upcoming job interviews.',
      skills: 'What skills should I develop to advance in my career?',
      growth: 'How can I accelerate my professional growth and development?'
    };

    if (actionMessages[action]) {
      this.messageText = actionMessages[action];
      this.focusInput();
      this.autoResizeTextarea();
    }
  }
}
