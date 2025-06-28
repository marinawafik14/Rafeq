import { Component, Input, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService } from '../../../Services/chat.service';
import { AuthService } from '../../../Services/auth.service';

interface VoiceInfo {
  exists: boolean;
  fileName: string;
  fileSize: number;
  fileSizeFormatted: string;
  streamUrl: string;
  contentType: string;
  lastModified: string;
}

@Component({
  selector: 'app-voice-message',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="voice-message" [class.sent]="isSent" [class.received]="!isSent">
      <!-- Hidden Audio Element -->
      <audio
        #audioPlayer
        (loadedmetadata)="onLoadedMetadata()"
        (timeupdate)="onTimeUpdate()"
        (ended)="onEnded()"
        (error)="onError()"
        preload="none">
      </audio>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="voice-loading">
        <div class="loading-spinner"></div>
        <span>Loading...</span>
      </div>

      <!-- Error State -->
      <div *ngIf="hasError && !isLoading" class="voice-error">
        <i class="fas fa-exclamation-triangle"></i>
        <span>Voice message unavailable</span>
      </div>

      <!-- Voice Player -->
      <div *ngIf="!isLoading && !hasError && voiceInfo?.exists" class="voice-player">
        
        <!-- Play/Pause Button -->
        <button class="play-button" (click)="togglePlay()" [disabled]="isLoadingAudio">
          <i *ngIf="!isPlaying && !isLoadingAudio" class="fas fa-play"></i>
          <i *ngIf="isPlaying && !isLoadingAudio" class="fas fa-pause"></i>
          <i *ngIf="isLoadingAudio" class="fas fa-spinner fa-spin"></i>
        </button>

        <!-- Waveform and Progress -->
        <div class="voice-content">
          <div class="waveform-container" (click)="seekTo($event)">
            <!-- Animated Waveform -->
            <div class="waveform">
              <div 
                *ngFor="let bar of waveformBars; let i = index" 
                class="waveform-bar"
                [style.height.%]="bar"
                [class.active]="progress > (i / waveformBars.length) * 100"
                [class.playing]="isPlaying && progress > (i / waveformBars.length) * 100">
              </div>
            </div>
            
            <!-- Progress Overlay -->
            <div class="progress-overlay" [style.width.%]="progress"></div>
          </div>

          <!-- Time and Controls -->
          <div class="voice-controls">
            <span class="time-display">
              {{ formatTime(isPlaying ? currentTime : duration) }}
            </span>
            
            <button class="speed-button" (click)="changePlaybackSpeed()">
              {{ playbackSpeed }}x
            </button>
          </div>
        </div>

        <!-- Voice Info -->
        <div class="voice-info">
          <i class="fas fa-microphone"></i>
          <span class="file-size">{{ voiceInfo?.fileSizeFormatted }}</span>
        </div>
      </div>

      <!-- Message Timestamp -->
      <div class="message-time">
        {{ timestamp | date:'HH:mm' }}
        <i *ngIf="isSent" class="fas fa-check-double message-status"></i>
      </div>
    </div>
  `,
  styleUrls: ['./voice-message.component.css']
})
export class VoiceMessageComponent implements OnInit, OnDestroy {
  @Input() fileName: string = '';
  @Input() isSent: boolean = false;
  @Input() senderName: string = '';
  @Input() timestamp: Date = new Date();
  
  @ViewChild('audioPlayer', { static: false }) audioPlayer!: ElementRef<HTMLAudioElement>;

  // Component state
  voiceInfo: VoiceInfo | null = null;
  isLoading = true;
  isLoadingAudio = false;
  isPlaying = false;
  duration = 0;
  currentTime = 0;
  progress = 0;
  hasError = false;
  
  // Audio handling
  private audioBlob: Blob | null = null;
  private audioUrl: string | null = null;
  
  // Visual waveform (fake animation)
  waveformBars = Array(30).fill(0).map(() => Math.random() * 100);
  playbackSpeed = 1; // 1x, 1.5x, 2x

  constructor(
    private chatService: ChatService,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    await this.loadVoiceInfo();
  }

  ngOnDestroy() {
    if (this.audioPlayer?.nativeElement) {
      this.audioPlayer.nativeElement.pause();
    }
    // Clean up blob URL
    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl);
    }
  }

  async loadVoiceInfo() {
    try {
      this.isLoading = true;
      
      // Call the voice-info endpoint using your ChatService
      this.voiceInfo = await this.chatService.getVoiceMessageInfo(this.fileName);
      
      if (!this.voiceInfo?.exists) {
        this.hasError = true;
        console.error('Voice file not found:', this.fileName);
      }
    } catch (error) {
      console.error('Error loading voice info:', error);
      this.hasError = true;
    } finally {
      this.isLoading = false;
    }
  }

  async togglePlay() {
    if (!this.audioPlayer?.nativeElement || !this.voiceInfo?.exists) return;

    const audio = this.audioPlayer.nativeElement;

    try {
      if (this.isPlaying) {
        audio.pause();
        this.isPlaying = false;
      } else {
        // Download the audio file with authentication if not already done
        if (!this.audioUrl) {
          this.isLoadingAudio = true;
          await this.loadAuthenticatedAudio();
          this.isLoadingAudio = false;
        }
        
        if (this.audioUrl) {
          audio.src = this.audioUrl;
          audio.playbackRate = this.playbackSpeed;
          await audio.play();
          this.isPlaying = true;
        }
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      this.hasError = true;
      this.isPlaying = false;
      this.isLoadingAudio = false;
    }
  }

  private async loadAuthenticatedAudio(): Promise<void> {
    try {
      // Get the token from AuthService
      const token = this.authService.getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Use fetch with authentication to get the audio file
      const streamUrl = this.chatService.getVoiceStreamUrl(this.fileName);
      const response = await fetch(streamUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.audioBlob = await response.blob();
      this.audioUrl = URL.createObjectURL(this.audioBlob);
    } catch (error) {
      console.error('Error loading authenticated audio:', error);
      throw error;
    }
  }

  onLoadedMetadata() {
    if (this.audioPlayer?.nativeElement) {
      this.duration = this.audioPlayer.nativeElement.duration;
    }
  }

  onTimeUpdate() {
    if (this.audioPlayer?.nativeElement) {
      this.currentTime = this.audioPlayer.nativeElement.currentTime;
      this.progress = this.duration > 0 ? (this.currentTime / this.duration) * 100 : 0;
    }
  }

  onEnded() {
    this.isPlaying = false;
    this.currentTime = 0;
    this.progress = 0;
  }

  onError() {
    this.hasError = true;
    this.isPlaying = false;
    this.isLoadingAudio = false;
    console.error('Audio playback error');
  }

  changePlaybackSpeed() {
    const speeds = [1, 1.5, 2];
    const currentIndex = speeds.indexOf(this.playbackSpeed);
    this.playbackSpeed = speeds[(currentIndex + 1) % speeds.length];
    
    if (this.audioPlayer?.nativeElement) {
      this.audioPlayer.nativeElement.playbackRate = this.playbackSpeed;
    }
  }

  seekTo(event: MouseEvent) {
    if (!this.audioPlayer?.nativeElement || this.duration === 0) return;

    const progressBar = event.currentTarget as HTMLElement;
    const rect = progressBar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = clickX / rect.width;
    
    const newTime = percentage * this.duration;
    this.audioPlayer.nativeElement.currentTime = newTime;
  }

  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}