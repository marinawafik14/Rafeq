import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

import { ChatService } from '../../Services/chat.service';
import { SignalrChatService } from '../../Services/signalr-chat.service';
import { AuthService } from '../../Services/auth.service'; 
import { ChatMessage } from '../../Models/Chat/chat-message';
import { ChatConversation } from '../../Models/Chat/chat-conversation';
import { ConversationParticipants } from '../../Models/Chat/conversation-participants';
import { SendMessageRequest } from '../../Models/Chat/send-message-request';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;

  // Data properties
  conversations: ChatConversation[] = [];
  messages: ChatMessage[] = [];
  selectedConversation: ChatConversation | null = null;
  participants: ConversationParticipants | null = null;
  currentUserId: number = 0;

  // UI state
  isLoading = true;
  isLoadingMessages = false;
  isSending = false;
  error: string | null = null;
  searchQuery = '';
  
  // Message input
  newMessage = '';
  selectedFile: File | null = null;
  
  // Real-time
  private subscriptions: Subscription[] = [];
  typingUsers: {[userId: number]: boolean} = {};
  
  // Auto-scroll
  private shouldScrollToBottom = true;

  // Add these properties
  private lastLoadTime = 0;
  private readonly LOAD_THROTTLE_MS = 2000; // 2 seconds

  constructor(
    private chatService: ChatService,
    private signalrService: SignalrChatService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService // Add this import
  ) {
    // Use AuthService to get the current user ID properly
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.currentUserId = currentUser.userId || 0;
      console.log('🔑 Current User from AuthService:', currentUser);
      console.log('🔑 Extracted User ID:', this.currentUserId);
    } else {
      console.error('❌ No current user found in AuthService');
    }
  }

  ngOnInit(): void {
    this.initializeChat();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.signalrService.stopConnection();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
    }
  }

  // Update the initializeChat method
  async initializeChat(): Promise<void> {
    try {
      // Load conversations first (this works)
      await this.loadConversations();

      // Initialize SignalR connection with better error handling
      const token = this.authService.getToken();
      if (token) {
        try {
          // Subscribe to connection status
          this.subscriptions.push(
            this.signalrService.initializeConnection().subscribe(status => {
              console.log('🔗 SignalR status changed:', status);
              
              // If reconnected and we have an active conversation, re-join
              if (status === 'Connected' && this.selectedConversation) {
                this.signalrService.joinChatRoom(this.selectedConversation.bookingId)
                  .catch(err => console.warn('Failed to rejoin chat room:', err));
              }
            })
          );

          this.setupSignalRListeners();
          console.log('✅ SignalR initialization started');
        } catch (signalrError) {
          console.warn('⚠️ SignalR initialization failed, continuing without real-time features:', signalrError);
        }
      }

      // Handle route parameters
      const bookingId = this.route.snapshot.paramMap.get('bookingId');
      if (bookingId) {
        const conversation = this.conversations.find(c => c.bookingId === parseInt(bookingId));
        if (conversation) {
          await this.selectConversation(conversation);
        }
      } else if (this.conversations.length > 0) {
        await this.selectConversation(this.conversations[0]);
      }

      this.isLoading = false;
    } catch (error) {
      console.error('Error initializing chat:', error);
      this.error = 'Failed to load chat. Please refresh the page.';
      this.isLoading = false;
    }
  }

  private setupSignalRListeners(): void {
    // New message received
    const messageReceivedSub = this.signalrService.messageReceived$.subscribe(message => {
      if (message && this.selectedConversation) {
        // Add message to current conversation if it belongs here
        const messageConversation = this.conversations.find(c => c.conversationId === message.conversationId);
        if (messageConversation) {
          // Update conversation last message
          messageConversation.lastMessage = {
            messageId: message.messageId,
            messageText: message.messageText,
            senderId: message.senderId,
            sentAt: message.sentAt,
            isRead: false
          };
          messageConversation.lastMessageAt = message.sentAt;
          
          // If it's the selected conversation, add to messages
          if (messageConversation.conversationId === this.selectedConversation.conversationId) {
            this.messages.push(message);
            this.shouldScrollToBottom = true;
            
            // Mark as read if not from current user
            if (message.senderId !== this.currentUserId) {
              this.markMessageAsRead(message.messageId);
            }
          } else {
            // Update unread count for other conversations
            messageConversation.unreadCount++;
          }
        }
      }
    });

    // User typing
    const typingSub = this.signalrService.userTyping$.subscribe(data => {
      if (data && data.userId !== this.currentUserId) {
        this.typingUsers[data.userId] = data.isTyping;
        
        // Clear typing after 3 seconds if still typing
        if (data.isTyping) {
          setTimeout(() => {
            this.typingUsers[data.userId] = false;
          }, 3000);
        }
      }
    });

    this.subscriptions.push(messageReceivedSub, typingSub);
  }

  private async loadConversations(): Promise<void> {
    const now = Date.now();
    if (now - this.lastLoadTime < this.LOAD_THROTTLE_MS) {
      return;
    }
    
    this.lastLoadTime = now;
    
    try {
      console.log('🔄 Loading conversations from multiple sources...');
      
      // Try to load from BOTH endpoints with better error handling
      const [existingConversations, potentialConversations] = await Promise.allSettled([
        this.chatService.getConversations().toPromise(),
        this.chatService.getPotentialConversations().toPromise()
      ]);

      // Process existing conversations
      const existing = existingConversations.status === 'fulfilled' ? 
        (existingConversations.value || []) : [];
      
      // Process potential conversations  
      const potential = potentialConversations.status === 'fulfilled' ? 
        (potentialConversations.value || []) : [];

      console.log('📊 Raw data:', {
        existing: existing.length,
        potential: potential.length,
        existingStatus: existingConversations.status,
        potentialStatus: potentialConversations.status
      });

      // Combine conversations smartly
      const allConversations = [...existing];
      const existingBookingIds = new Set(existing.map(c => c.bookingId));
      
      // Add potential conversations that aren't already in existing
      potential.forEach(p => {
        if (!existingBookingIds.has(p.bookingId)) {
          allConversations.push(p);
        }
      });

      // Remove duplicates by bookingId (extra safety)
      const uniqueConversations = allConversations.filter((conversation, index, self) => 
        index === self.findIndex(c => c.bookingId === conversation.bookingId)
      );

      // Sort by last message time
      this.conversations = uniqueConversations.sort((a, b) => {
        const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return bTime - aTime;
      });
      
      console.log('✅ Final conversations loaded:', this.conversations.length);
      console.log('📋 Conversation IDs:', this.conversations.map(c => c.bookingId));
      
    } catch (error) {
      console.error('❌ Error loading conversations:', error);
      this.conversations = [];
    }
  }

  // Update the selectConversation method to handle SignalR connection issues
  async selectConversation(conversation: ChatConversation): Promise<void> {
    console.log('🔗 Selecting conversation:', conversation.bookingId);

    if (this.selectedConversation?.bookingId === conversation.bookingId) {
      console.log('⏭️ Same conversation already selected');
      return;
    }

    this.selectedConversation = conversation;
    this.isLoadingMessages = true;
    this.messages = [];

    try {
      // 1. Load actual messages from the API
      console.log('📥 Loading messages for booking:', conversation.bookingId);
      const messagesFromAPI = await this.chatService.getChatHistory(conversation.bookingId).toPromise() || [];
      
      console.log('📨 Messages loaded from API:', messagesFromAPI.length);
      console.log('📋 Message details:', messagesFromAPI);

      if (messagesFromAPI.length > 0) {
        // Use real messages from database
        this.messages = messagesFromAPI;
      } else {
        // Only show welcome message if NO messages exist in database
        this.messages = [
          {
            messageId: 0,
            bookingId: conversation.bookingId,
            conversationId: 0,
            senderId: 0,
            senderName: 'System',
            senderProfilePicture: '',
            messageText: `💬 Welcome to your ${conversation.sessionType || 'mentorship'} session!\n\nThis is the beginning of your conversation. Feel free to introduce yourself and share any questions or materials you'd like to discuss.`,
            isRead: true,
            sentAt: new Date(),
            readByUserIds: [],
            attachments: []
          }
        ];
      }

      // 2. Load conversation participants
      try {
        const participantsData = await this.chatService.getConversationParticipants(conversation.bookingId).toPromise();
        this.participants = participantsData || null; // Handle undefined by converting to null
        console.log('👥 Participants loaded:', this.participants);
      } catch (participantError) {
        console.warn('⚠️ Could not load participants:', participantError);
        this.participants = null; // Explicitly set to null on error
      }

      // 3. Join SignalR room (if working)
      const signalRState = this.signalrService.getConnectionState();
      console.log('🔗 SignalR connection state:', signalRState);

      if (signalRState === 'Connected') {
        try {
          await this.signalrService.joinChatRoom(conversation.bookingId);
          console.log('✅ Joined SignalR room for booking:', conversation.bookingId);
        } catch (signalRError) {
          console.warn('⚠️ Could not join SignalR room:', signalRError);
        }
      } else {
        console.log('SignalR not connected, skipping chat room operations');
      }

      this.shouldScrollToBottom = true;
      this.isLoadingMessages = false;

      // Update URL
      this.router.navigate(['/chat', conversation.bookingId], { replaceUrl: true });

      // Debug info
      console.log('🔍 Selected conversation data:', {
        bookingId: conversation.bookingId,
        sessionType: conversation.sessionType,
        sessionStatus: conversation.sessionStatus,
        mentorName: conversation.mentorName,
        menteeName: conversation.menteeName,
        totalMessages: this.messages.length
      });

    } catch (error) {
      console.error('❌ Error selecting conversation:', error);
      this.isLoadingMessages = false;
      this.messages = [{
        messageId: 0,
        bookingId: conversation.bookingId,
        conversationId: 0,
        senderId: 0,
        senderName: 'System',
        senderProfilePicture: '',
        messageText: 'Error loading conversation. Please try again.',
        isRead: true,
        sentAt: new Date(),
        readByUserIds: [],
        attachments: []
      }];
    }
  }

  async sendMessage(): Promise<void> {
    if (!this.newMessage.trim() && !this.selectedFile) return;
    if (!this.selectedConversation) return;

    try {
      this.isSending = true;

      const request: SendMessageRequest = {
        bookingId: this.selectedConversation.bookingId,
        messageText: this.newMessage.trim()
      };

      const sentMessage = await this.chatService.sendMessage(request).toPromise();
      
      if (sentMessage) {
        console.log('✅ Message sent successfully:', sentMessage);

       
        this.messages.push(sentMessage);
        this.shouldScrollToBottom = true;

        // Clear input immediately
        this.newMessage = '';
        this.selectedFile = null;

        // Refresh the conversation to get updated messages
        setTimeout(async () => {
          console.log('🔄 Refreshing conversation after send...');
          await this.selectConversation(this.selectedConversation!);
          await this.loadConversations(); // Also refresh conversation list
        }, 1000);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      Swal.fire({
        icon: 'error',
        title: 'Failed to Send',
        text: 'Message could not be sent. Please try again.',
        confirmButtonColor: '#0a2e65'
      });
    } finally {
      this.isSending = false;
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        Swal.fire({
          icon: 'error',
          title: 'File Too Large',
          text: 'Please select a file smaller than 10MB',
          confirmButtonColor: '#0a2e65'
        });
        return;
      }

      this.selectedFile = file;
    }
  }

  async uploadFile(): Promise<void> {
    if (!this.selectedFile || !this.selectedConversation) return;

    try {
      this.isSending = true;
      
      const attachment = await this.chatService.uploadAttachment(
        this.selectedConversation.bookingId, 
        this.selectedFile
      ).toPromise();

      if (attachment) {
        // The attachment upload creates a message automatically
        // Refresh messages to show the new file message
        await this.loadMessages();
      }

      this.selectedFile = null;
      // Reset file input
      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error('Error uploading file:', error);
      Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: 'Failed to upload file. Please try again.',
        confirmButtonColor: '#0a2e65'
      });
    } finally {
      this.isSending = false;
    }
  }

  private async loadMessages(): Promise<void> {
    if (!this.selectedConversation) return;

    try {
      this.messages = await this.chatService.getChatHistory(this.selectedConversation.bookingId).toPromise() || [];
      this.shouldScrollToBottom = true;
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }

  private async markMessageAsRead(messageId: number): Promise<void> {
    try {
      await this.chatService.markMessageAsRead(messageId).toPromise();
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }

  onTyping(): void {
    if (this.selectedConversation) {
      this.signalrService.sendTypingIndicator(this.selectedConversation.bookingId, true);
      
      // Send stop typing after 1 second of no typing
      setTimeout(() => {
        if (this.selectedConversation) {
          this.signalrService.sendTypingIndicator(this.selectedConversation.bookingId, false);
        }
      }, 1000);
    }
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    } catch (error) {
      console.error('Error scrolling to bottom:', error);
    }
  }

  // Helper methods
  isMyMessage(message: ChatMessage): boolean {
    return message.senderId === this.currentUserId;
  }

  // Update the openGoogleMeet method to handle undefined
  openGoogleMeet(link: string | undefined): void {
    if (link) {
      window.open(link, '_blank');
    } else {
      console.warn('No Google Meet link available');
    }
  }

  // Update the formatMessageTime method to be more robust
  formatMessageTime(date: Date | string | null | undefined): string {
    // Handle null, undefined, or empty values
    if (!date) return '';
    
    try {
      const messageDate = new Date(date);
      
      // Check if date is valid
      if (isNaN(messageDate.getTime())) {
        console.warn('Invalid date provided:', date);
        return '';
      }
      
      const now = new Date();
      const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 24) {
        return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        return messageDate.toLocaleDateString() + ' ' + 
               messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    } catch (error) {
      console.error('Error formatting date:', error, 'Input:', date);
      return '';
    }
  }

  // Fix the getUserName method to show the OTHER person, not yourself
  getUserName(conversation: ChatConversation): string {
    // Show the OTHER participant's name, not your own
    if (this.currentUserId === conversation.mentorId) {
      // You are the mentor, show the mentee's name
      return conversation.menteeName;
    } else {
      // You are the mentee, show the mentor's name  
      return conversation.mentorName;
    }
  }

  getUserProfilePicture(conversation: ChatConversation): string {
    // Show the OTHER participant's profile picture
    if (this.currentUserId === conversation.mentorId) {
      // You are the mentor, show the mentee's picture
      return conversation.menteeProfilePicture || '';
    } else {
      // You are the mentee, show the mentor's picture
      return conversation.mentorProfilePicture || '';
    }
  }

  getOtherParticipant(): any {
    if (!this.participants) return null;
    
    // Return the OTHER participant, not yourself
    if (this.currentUserId === this.participants.mentor.userId) {
      // You are the mentor, return mentee info
      return this.participants.mentee;
    } else {
      // You are the mentee, return mentor info
      return this.participants.mentor;
    }
  }

  // Add these helper methods
  getDefaultAvatarPath(): string {
    return '/images/default-avatar.png';
  }

  getUserInitials(conversation: ChatConversation): string {
    const name = this.getUserName(conversation);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  get filteredConversations(): ChatConversation[] {
    if (!this.searchQuery.trim()) {
      return this.conversations;
    }
    
    const query = this.searchQuery.toLowerCase();
    return this.conversations.filter(conv => 
      conv.mentorName.toLowerCase().includes(query) ||
      conv.menteeName.toLowerCase().includes(query) ||
      conv.lastMessage?.messageText.toLowerCase().includes(query)
    );
  }

  isUserTyping(): boolean {
    return Object.values(this.typingUsers).some(typing => typing);
  }

  onEnterKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  downloadAttachment(messageId: number, fileName: string): void {
    this.chatService.downloadAttachment(messageId).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error: any) => {
        console.error('Error downloading attachment:', error);
        Swal.fire({
          icon: 'error',
          title: 'Download Failed',
          text: 'Unable to download file',
          confirmButtonColor: '#0a2e65'
        });
      }
    });
  }

  // Enhanced debug method to see what's happening
  debugUserInfo(conversation: ChatConversation): void {
    console.log('🔍 DETAILED DEBUG INFO:');
    console.log('='.repeat(50));
    console.log('🔑 Current User ID:', this.currentUserId);
    console.log('📋 Conversation Data:', {
      bookingId: conversation.bookingId,
      mentorId: conversation.mentorId,
      mentorName: conversation.mentorName,
      menteeId: conversation.menteeId,
      menteeName: conversation.menteeName
    });
    console.log('🤔 Identity Check:');
    console.log('  Am I the mentor?', this.currentUserId === conversation.mentorId);
    console.log('  Am I the mentee?', this.currentUserId === conversation.menteeId);
    console.log('👤 Display Results:');
    console.log('  getUserName() returns:', this.getUserName(conversation));
    console.log('  Should show OTHER person, not myself');
    console.log('='.repeat(50));
    
    // Show an alert with the key info
    alert(`Debug Info:
Current User ID: ${this.currentUserId}
Mentor ID: ${conversation.mentorId} (${conversation.mentorName})
Mentee ID: ${conversation.menteeId} (${conversation.menteeName})

You are the: ${this.currentUserId === conversation.mentorId ? 'MENTOR' : 'MENTEE'}
You should see: ${this.getUserName(conversation)}`);
  }

  // Add manual refresh method
  async refreshConversations(): Promise<void> {
    console.log('🔄 Manual refresh triggered...');
    this.lastLoadTime = 0; // Reset throttle
    await this.loadConversations();
    
    // Reload current conversation messages if one is selected
    if (this.selectedConversation) {
      const currentBookingId = this.selectedConversation.bookingId;
      const conversation = this.conversations.find(c => c.bookingId === currentBookingId);
      if (conversation) {
        await this.selectConversation(conversation);
      }
    }
    
    console.log('✅ Refresh completed');
  }
}
