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
  templateUrl: './voice-message.component.html',
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
      const duration = this.audioPlayer.nativeElement.duration;
      
      // Only set duration if it's a valid finite number
      if (duration && isFinite(duration) && !isNaN(duration)) {
        this.duration = duration;
      } else {
        this.duration = 0;
        console.warn('Invalid audio duration detected');
      }
    }
  }

  onTimeUpdate() {
    if (this.audioPlayer?.nativeElement) {
      const currentTime = this.audioPlayer.nativeElement.currentTime;
      const duration = this.audioPlayer.nativeElement.duration;
      
      // Only update if we have valid values
      if (currentTime && isFinite(currentTime) && !isNaN(currentTime)) {
        this.currentTime = currentTime;
      }
      
      if (duration && isFinite(duration) && !isNaN(duration) && duration > 0) {
        this.duration = duration;
        this.progress = (this.currentTime / duration) * 100;
      } else {
        this.progress = 0;
      }
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

  onCanPlay() {
    // This event fires when the audio is ready to play
    if (this.audioPlayer?.nativeElement) {
      const duration = this.audioPlayer.nativeElement.duration;
      if (duration && isFinite(duration) && !isNaN(duration)) {
        this.duration = duration;
      }
    }
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
    if (!this.audioPlayer?.nativeElement || this.duration === 0 || !isFinite(this.duration)) {
      return;
    }

    const progressBar = event.currentTarget as HTMLElement;
    const rect = progressBar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    
    const newTime = percentage * this.duration;
    if (isFinite(newTime) && newTime >= 0) {
      this.audioPlayer.nativeElement.currentTime = newTime;
    }
  }

  formatTime(seconds: number): string {
    // Handle invalid or undefined values
    if (!seconds || isNaN(seconds) || !isFinite(seconds) || seconds <= 0) {
      return '0:00';
    }
    
    // Ensure we have a valid positive number
    const validSeconds = Math.max(0, Math.floor(seconds));
    
    const mins = Math.floor(validSeconds / 60);
    const secs = validSeconds % 60;
    
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}