import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

import { ChatService } from '../../Services/chat.service';
import { SignalrChatService } from '../../Services/signalr-chat.service';
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

  constructor(
    private chatService: ChatService,
    private signalrService: SignalrChatService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    // Get current user ID from token or auth service
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.currentUserId = parseInt(payload.nameid || payload.userId || payload.sub);
      } catch (e) {
        console.error('Error parsing token:', e);
      }
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

  async initializeChat(): Promise<void> {
    try {
      // Start SignalR connection
      const token = localStorage.getItem('token');
      if (token) {
        await this.signalrService.startConnection(token);
        this.setupSignalRListeners();
      }

      // Load conversations
      await this.loadConversations();

      // Check if specific booking ID in route
      const bookingId = this.route.snapshot.paramMap.get('bookingId');
      if (bookingId) {
        const conversation = this.conversations.find(c => c.bookingId === parseInt(bookingId));
        if (conversation) {
          this.selectConversation(conversation);
        }
      } else if (this.conversations.length > 0) {
        // Select first conversation by default
        this.selectConversation(this.conversations[0]);
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
    try {
      this.conversations = await this.chatService.getConversations().toPromise() || [];
    } catch (error) {
      console.error('Error loading conversations:', error);
      throw error;
    }
  }

  async selectConversation(conversation: ChatConversation): Promise<void> {
    if (this.selectedConversation?.conversationId === conversation.conversationId) {
      return; // Already selected
    }

    try {
      this.isLoadingMessages = true;
      this.selectedConversation = conversation;
      this.messages = [];

      // Leave previous conversation
      if (this.selectedConversation) {
        await this.signalrService.leaveBookingChat(this.selectedConversation.bookingId);
      }

      // Join new conversation
      await this.signalrService.joinBookingChat(conversation.bookingId);

      // Load conversation participants
      this.participants = await this.chatService.getConversationParticipants(conversation.bookingId).toPromise() || null;

      // Load messages
      this.messages = await this.chatService.getChatHistory(conversation.bookingId).toPromise() || [];

      // Mark all messages as read
      await this.chatService.markAllMessagesAsRead(conversation.bookingId).toPromise();
      conversation.unreadCount = 0;

      this.shouldScrollToBottom = true;
      this.isLoadingMessages = false;

      // Update URL
      this.router.navigate(['/chat', conversation.bookingId], { replaceUrl: true });

    } catch (error) {
      console.error('Error selecting conversation:', error);
      this.isLoadingMessages = false;
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load conversation',
        confirmButtonColor: '#0a2e65'
      });
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
        // Add to messages
        this.messages.push(sentMessage);
        
        // Update conversation
        this.selectedConversation.lastMessage = {
          messageId: sentMessage.messageId,
          messageText: sentMessage.messageText,
          senderId: sentMessage.senderId,
          sentAt: sentMessage.sentAt,
          isRead: false
        };
        this.selectedConversation.lastMessageAt = sentMessage.sentAt;

        // Clear input
        this.newMessage = '';
        this.selectedFile = null;
        this.shouldScrollToBottom = true;
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

  // Update the formatMessageTime method to handle null/undefined
  formatMessageTime(date: Date | string | null | undefined): string {
    if (!date) return '';
    
    try {
      const messageDate = new Date(date);
      if (isNaN(messageDate.getTime())) return ''; // Invalid date
      
      const now = new Date();
      const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 24) {
        return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        return messageDate.toLocaleDateString() + ' ' + 
               messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  }

  getOtherParticipant(): any {
    if (!this.participants) return null;
    return this.currentUserId === this.participants.mentor.userId 
      ? this.participants.mentee 
      : this.participants.mentor;
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
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
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
}
