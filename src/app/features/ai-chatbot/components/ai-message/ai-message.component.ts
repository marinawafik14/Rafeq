import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AiMessage } from '../../../../Models/ai/ai-message';
import { FileAttachment } from '../../../../Models/ai/file-attachment';

@Component({
  selector: 'app-ai-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ai-message.component.html',
  styleUrl: './ai-message.component.css'
})
export class AiMessageComponent implements OnInit {
  @Input() message!: AiMessage;
  @Input() isProcessing = false;

 
  showMetadata = false;
  // TTS audio playback state
  audio: HTMLAudioElement | null = null;
  isPlaying = false;
  audioProgress = 0;
  audioDuration = 0;
  audioError: string | null = null;

  ngOnInit(): void {
    if (!this.message) {
      console.error('AiMessageComponent: message input is required');
    }
  }

  get ttsAudioUrl(): string | null {
    return (this.message?.metadata && (this.message.metadata as any).ttsAudioUrl) || null;
  }

  playAudio(): void {
    if (!this.ttsAudioUrl) return;
    if (!this.audio) {
      this.audio = new Audio(this.ttsAudioUrl);
      this.audio.addEventListener('ended', () => this.isPlaying = false);
      this.audio.addEventListener('timeupdate', () => {
        if (this.audio) {
          this.audioProgress = this.audio.currentTime;
          this.audioDuration = this.audio.duration;
        }
      });
      this.audio.addEventListener('error', () => {
        this.audioError = 'Failed to play audio.';
        this.isPlaying = false;
      });
    }
    this.audio.play().then(() => {
      this.isPlaying = true;
    }).catch(err => {
      this.audioError = 'Failed to play audio.';
      this.isPlaying = false;
    });
  }

  pauseAudio(): void {
    if (this.audio) {
      this.audio.pause();
      this.isPlaying = false;
    }
  }

  toggleAudio(): void {
    if (this.isPlaying) {
      this.pauseAudio();
    } else {
      this.playAudio();
    }
  }

  get audioProgressPercent(): number {
    if (!this.audioDuration) return 0;
    return (this.audioProgress / this.audioDuration) * 100;
  }

  // Format message content for display
  get formattedContent(): string {
    if (!this.message?.content) return '';
    
    // Convert markdown-style formatting to HTML
    let content = this.message.content;
    
    // Bold text
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic text
    content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Code blocks
    content = content.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    
    // Inline code
    content = content.replace(/`(.*?)`/g, '<code>$1</code>');
    
    // Line breaks
    content = content.replace(/\n/g, '<br>');
    
    // Numbered lists
    content = content.replace(/^\d+\.\s(.+)$/gm, '<ol><li>$1</li></ol>');
    content = content.replace(/<\/ol>\s*<ol>/g, '');
    
    // Bullet points
    content = content.replace(/^[-*]\s(.+)$/gm, '<ul><li>$1</li></ul>');
    content = content.replace(/<\/ul>\s*<ul>/g, '');
    
    return content;
  }

  // Get message timestamp in readable format
  get messageTime(): string {
    if (!this.message?.timestamp) return '';
    
    const now = new Date();
    const messageDate = new Date(this.message.timestamp);
    const diffInMinutes = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ago`;
    } else {
      return messageDate.toLocaleDateString();
    }
  }

  // Check if message is from user
  get isUserMessage(): boolean {
    return this.message?.role === 'user';
  }

  // Check if message is from AI
  get isAiMessage(): boolean {
    return this.message?.role === 'assistant';
  }

  // Check if message is system message
  get isSystemMessage(): boolean {
    return this.message?.role === 'system';
  }

  // Get avatar for message
  get messageAvatar(): string {
    if (this.isUserMessage) {
      return '/images/default-avatar.png'; // User avatar
    } else if (this.isAiMessage) {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiM2NjdlZWEiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0xMiAyQzEzLjEgMiAxNCAyLjkgMTQgNFY4SDEwVjRDMTAgMi45IDEwLjkgMiAxMiAyWk0yMSAxMUgxOVY5SDIxVjExWk01IDExSDNWOUg1VjExWk02IDIwSDE4QzE4LjYgMjAgMTkgMTkuNiAxOSAxOVYxM0M5LjQgMTMgNSAxNy40IDUgMjBINlpNMTMgOVYxMUgxMVY5SDEzWiIgZmlsbD0id2hpdGUiLz4KPHN2Zz4KPC9zdmc+'; // AI robot avatar
    }
    return '';
  }

  // Check if message has attachments
  get hasAttachments(): boolean {
    return !!(this.message?.attachments && this.message.attachments.length > 0);
  }

  // Get file icon based on file type
  getFileIcon(fileType: string): string {
    if (fileType.includes('pdf')) return 'fas fa-file-pdf';
    if (fileType.includes('image')) return 'fas fa-file-image';
    if (fileType.includes('doc')) return 'fas fa-file-word';
    return 'fas fa-file';
  }

  // Get file type color
  getFileColor(fileType: string): string {
    if (fileType.includes('pdf')) return '#dc3545';
    if (fileType.includes('image')) return '#198754';
    if (fileType.includes('doc')) return '#0d6efd';
    return '#6c757d';
  }

  // Format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Handle attachment click
  onAttachmentClick(attachment: FileAttachment): void {
    if (attachment.fileType.startsWith('image/') && attachment.base64Data) {
      // Open image in new window
      const imageWindow = window.open();
      if (imageWindow) {
        imageWindow.document.write(`
          <html>
            <head><title>${attachment.fileName}</title></head>
            <body style="margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5;">
              <img src="data:${attachment.fileType};base64,${attachment.base64Data}" 
                   alt="${attachment.fileName}" 
                   style="max-width: 100%; max-height: 100%; object-fit: contain;">
            </body>
          </html>
        `);
      }
    } else if (attachment.content) {
      // For text files, show content in modal or new window
      console.log('File content:', attachment.content);
    }
  }

  // Copy message content to clipboard
  copyToClipboard(): void {
    if (navigator.clipboard && this.message?.content) {
      navigator.clipboard.writeText(this.message.content).then(() => {
        // Could emit event to show toast notification
        console.log('Message copied to clipboard');
      }).catch(err => {
        console.error('Failed to copy message:', err);
      });
    }
  }

  // Get processing indicator text
  get processingText(): string {
    if (!this.isProcessing) return '';
    
    const messages = [
      'Analyzing your request...',
      'Processing information...',
      'Generating response...',
      'Almost ready...'
    ];
    
    // Cycle through messages based on time
    const index = Math.floor(Date.now() / 2000) % messages.length;
    return messages[index];
  }

  // Get metadata info for display
  get metadataInfo(): string[] {
    const info: string[] = [];
    
    if (this.message?.metadata?.model) {
      info.push(`Model: ${this.message.metadata.model}`);
    }
    
    if (this.message?.metadata?.tokensUsed) {
      info.push(`Tokens: ${this.message.metadata.tokensUsed}`);
    }
    
    if (this.message?.metadata?.processingTime) {
      const time = (Date.now() - this.message.metadata.processingTime) / 1000;
      info.push(`Response time: ${time.toFixed(1)}s`);
    }
    
    return info;
  }
}
