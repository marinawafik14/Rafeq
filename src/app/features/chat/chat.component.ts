import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewChecked, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { environment } from '../../environments/environment.development';

import { ChatService } from '../../Services/chat.service';
import { SignalrChatService } from '../../Services/signalr-chat.service';
import { AuthService } from '../../Services/auth.service'; 
import { ProfileService } from '../../Services/profile.service'; 
import { ChatMessage } from '../../Models/Chat/chat-message';
import { ChatConversation } from '../../Models/Chat/chat-conversation';
import { ConversationParticipants } from '../../Models/Chat/conversation-participants';
import { SendMessageRequest } from '../../Models/Chat/send-message-request';
import { VoiceMessageComponent } from '../../shared/components/voice-message/voice-message.component';
import { MenteeLayoutComponent } from '../../mentee/mentee-layout.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, VoiceMessageComponent, MenteeLayoutComponent],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  menteeId: number | null = null;
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

  // Voice message
  isRecording = false;
  isUploadingVoice = false;
  recordingDuration = 0;
  audioChunks: Blob[] = [];
  mediaRecorder: any = null;
  recordingTimer: any = null;

  // Reactions
  showEmojiPicker: { [messageId: number]: boolean } = {};
  emojiList: string[] = ['👍', '❤️', '😂', '😮', '😢', '👏'];

  // Edit message
  editingMessageId: number | null = null;
  editedMessageText: string = '';

  private apiUrl = environment.apiUrl;

  constructor(
    private chatService: ChatService,
    private signalrService: SignalrChatService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private profileService: ProfileService // Add this service
  ) {
    // Use AuthService to get the current user ID properly
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.currentUserId = currentUser.userId || 0;
      // Set menteeId only if user is a mentee
      if (currentUser.role === 'Mentee') {
        this.menteeId = currentUser.userId;
      }
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
    console.log('🔗 Setting up SignalR listeners...');

    // Message received (for attachments and new messages)
    const messageReceivedSub = this.signalrService.messageReceived$.subscribe(message => {
      console.log('📨 SignalR: New message received:', message);
      
      if (message && this.selectedConversation && message.senderId !== this.currentUserId) {
        // Only add messages from OTHER users via SignalR
        if (message.bookingId === this.selectedConversation.bookingId) {
          console.log('➕ Adding message from other user to current conversation');
          this.messages.push(message);
          this.shouldScrollToBottom = true;
          
          // Mark as read since it's not from current user
          this.markMessageAsRead(message.messageId);
        }
        
        // Update conversation list
        const messageConversation = this.conversations.find(c => c.bookingId === message.bookingId);
        if (messageConversation) {
          messageConversation.lastMessage = {
            messageId: message.messageId,
            messageText: message.messageText || '[Attachment]',
            senderId: message.senderId,
            sentAt: message.sentAt,
            isRead: false
          };
          messageConversation.lastMessageAt = message.sentAt;
          
          if (messageConversation.bookingId !== this.selectedConversation?.bookingId) {
            messageConversation.unreadCount++;
          }
        }
      }
    });

    // Typing indicators
    const typingSub = this.signalrService.userTyping$.subscribe(data => {
      console.log('⌨️ SignalR: Typing indicator:', data);
      
      if (data && data.userId !== this.currentUserId) {
        this.typingUsers[data.userId] = data.isTyping;
        
        if (data.isTyping) {
          setTimeout(() => {
            this.typingUsers[data.userId] = false;
          }, 3000);
        }
      }
    });

    // Message reactions
    const reactionSub = this.signalrService.messageReaction$.subscribe(reaction => {
      console.log('👍 SignalR: Message reaction received:', reaction);
      
      if (reaction && this.messages) {
        const msg = this.messages.find(m => m.messageId === reaction.messageId);
        if (msg) {
          this.chatService.getMessageReactions(msg.messageId).subscribe(reactions => {
            msg.reactions = reactions;
          });
        }
      }
    });

    // IMPROVED: Message deletion
    const messageDeletedSub = this.signalrService.messageDeleted$.subscribe(data => {
      console.log('🗑️ SignalR: Message deleted event received:', data);
      
      if (data && this.messages) {
        let messageIdToDelete = data.messageId;
        let bookingIdToCheck = data.bookingId;
        
        // If bookingId is 0, use current conversation's bookingId
        if (bookingIdToCheck === 0 && this.selectedConversation) {
          bookingIdToCheck = this.selectedConversation.bookingId;
        }
        
        console.log(`🗑️ Attempting to delete message ${messageIdToDelete} from booking ${bookingIdToCheck}`);
        
        // Only process if it's for current conversation OR if we have a valid bookingId
        if (!this.selectedConversation || bookingIdToCheck === this.selectedConversation.bookingId) {
          const messageIndex = this.messages.findIndex(m => m.messageId === messageIdToDelete);
          if (messageIndex > -1) {
            console.log('✅ Removing message from UI via SignalR');
            this.messages.splice(messageIndex, 1);
            
            // Update conversation last message if needed
            this.updateConversationLastMessage();
          } else {
            console.log('⚠️ Message not found in current messages list');
          }
        }
      }
    });

    // IMPROVED: Message editing
    const messageEditedSub = this.signalrService.messageEdited$.subscribe(editedMessage => {
      console.log('✏️ SignalR: Message edited event received:', editedMessage);
      
      if (editedMessage && this.messages && editedMessage.senderId !== this.currentUserId) {
        // Only handle edits from OTHER users
        const messageIndex = this.messages.findIndex(m => m.messageId === editedMessage.messageId);
        if (messageIndex > -1) {
          console.log('✅ Updating message from other user via SignalR');
          this.messages[messageIndex] = { ...this.messages[messageIndex], ...editedMessage };
          
          // Update conversation last message if needed
          this.updateConversationLastMessage();
        }
      }
    });

    this.subscriptions.push(
      messageReceivedSub, 
      typingSub, 
      reactionSub,
      messageDeletedSub,
      messageEditedSub
    );
  }

  // Add this helper method:
  private updateConversationLastMessage(): void {
    if (!this.selectedConversation || this.messages.length === 0) return;

    const lastMessage = this.messages[this.messages.length - 1];
    const conversation = this.conversations.find(c => c.bookingId === this.selectedConversation!.bookingId);
    
    if (conversation && lastMessage) {
      conversation.lastMessage = {
        messageId: lastMessage.messageId,
        messageText: lastMessage.messageText || '[Attachment]',
        senderId: lastMessage.senderId,
        sentAt: lastMessage.sentAt,
        isRead: lastMessage.isRead
      };
      conversation.lastMessageAt = lastMessage.sentAt;
    }
  }

  private async loadConversations(): Promise<void> {
    const now = Date.now();
    if (now - this.lastLoadTime < this.LOAD_THROTTLE_MS) {
      return;
    }
    
    this.lastLoadTime = now;
    
    try {
      console.log('🔄 Loading conversations...');
      
      // Use the service method that handles filtering
      this.conversations = await this.chatService.getAllConversations().toPromise() || [];
      
      console.log('✅ Conversations loaded:', this.conversations.length);
      console.log('📋 Conversation statuses:', this.conversations.map(c => ({
        id: c.bookingId,
        status: c.sessionStatus,
        mentorName: c.mentorName,
        menteeName: c.menteeName
      })));
      
    } catch (error) {
      console.error('❌ Error loading conversations:', error);
      this.conversations = [];
    }
  }

  // 1. Always join the SignalR room when selecting a conversation
  async selectConversation(conversation: ChatConversation): Promise<void> {
    console.log('🔗 Selecting conversation:', conversation.bookingId);

    // Always join the SignalR room for this conversation
    const signalRState = this.signalrService.getConnectionState();
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
      const messages = await this.chatService.getChatHistory(conversation.bookingId).toPromise() || [];
      
      console.log('📨 Messages loaded from API:', messages.length);
      console.log('📋 Message details:', messages);

      if (messages.length > 0) {
        // Use real messages from database
        await Promise.all(messages.map(async (msg) => {
          msg.reactions = await this.chatService.getMessageReactions(msg.messageId).toPromise();
        }));
        this.messages = messages;
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

      // After loading messages
      if (this.messages && this.messages.length > 0) {
        this.messages.forEach(msg => {
          if (!msg.isRead && msg.senderId !== this.currentUserId) {
            this.markMessageAsRead(msg.messageId);
            msg.isRead = true; // Optimistically update UI
          }
        });
      }

      // After marking messages as read
      const conv = this.conversations.find(c => c.bookingId === conversation.bookingId);
      if (conv) {
        conv.unreadCount = 0;
      }

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

  // --- VOICE RECORDING STATE & LOGIC ---
  // Start recording on button press
  async startVoiceRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      Swal.fire('Not supported', 'Your browser does not support audio recording.', 'error');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new (window as any).MediaRecorder(stream, {
        mimeType: this.getSupportedMimeType()
      });
      this.audioChunks = [];
      this.isRecording = true;
      this.recordingDuration = 0;
      this.mediaRecorder.ondataavailable = (e: any) => {
        if (e.data.size > 0) this.audioChunks.push(e.data);
      };
      this.mediaRecorder.onstop = () => {
        this.isRecording = false;
        clearInterval(this.recordingTimer);
      };
      this.mediaRecorder.start(100);
      this.startRecordingTimer();
    } catch (error) {
      Swal.fire('Error', 'Microphone access denied or unavailable.', 'error');
    }
  }

  // Stop and upload recording
  async stopVoiceRecording() {
    if (!this.mediaRecorder || !this.isRecording) return;
    this.isUploadingVoice = true;
    clearInterval(this.recordingTimer);
    this.mediaRecorder.onstop = async () => {
      this.isRecording = false;
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      if (audioBlob.size > 0 && this.recordingDuration >= 1) {
        await this.uploadVoiceMessage(audioBlob);
      } else {
        Swal.fire('Too Short', 'Recording too short. Please record at least 1 second.', 'warning');
      }
      this.cleanupVoiceRecording();
      this.isUploadingVoice = false;
    };
    this.mediaRecorder.stop();
  }

  // Cancel recording (on mouseleave/slide)
  cancelVoiceRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.cleanupVoiceRecording();
      this.isRecording = false;
      this.isUploadingVoice = false;
    }
  }

  private startRecordingTimer() {
    this.recordingTimer = setInterval(() => {
      this.recordingDuration++;
      if (this.recordingDuration >= 600) {
        this.stopVoiceRecording();
      }
    }, 1000);
  }

  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/mpeg'
    ];
    for (const type of types) {
      if ((window as any).MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return 'audio/webm';
  }

  private async uploadVoiceMessage(audioBlob: Blob) {
    if (!this.selectedConversation) return;
    try {
      const audioFile = new File([audioBlob], 'voice-message.webm', { type: 'audio/webm' });
      console.log('Uploading voice message:', {
        bookingId: this.selectedConversation?.bookingId,
        audioFile,
        type: audioFile.type,
        size: audioFile.size
      });
      const result = await this.chatService.uploadVoiceMessage(this.selectedConversation.bookingId, audioFile).toPromise();
      console.log('✅ Uploaded voice message result:', result);
      await this.loadMessages();
    } catch (err) {
      Swal.fire('Error', 'Failed to send voice message.', 'error');
    }
  }

  private cleanupVoiceRecording() {
    clearInterval(this.recordingTimer);
    this.recordingDuration = 0;
    this.audioChunks = [];
    this.mediaRecorder = null;
  }

  formatRecordingTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // --- REACTIONS ---
  toggleEmojiPicker(messageId: number) {
    this.showEmojiPicker[messageId] = !this.showEmojiPicker[messageId];
  }

  async addReaction(messageId: number, emoji: string): Promise<void> {
    const msg = this.messages.find(m => m.messageId === messageId);
    if (!msg) return;

    const myReaction = this.getMyReaction(msg);

    if (myReaction && myReaction.reactionType === emoji) {
      // Remove reaction if clicking the same one
      try {
        await this.chatService.removeReaction(messageId, emoji).toPromise();
        // Remove from UI
        msg.reactions = (msg.reactions ?? []).filter((r: any) => !(r.userId === this.currentUserId && r.reactionType === emoji));
      } catch (err) {
        Swal.fire('Error', 'Failed to remove reaction.', 'error');
      }
    } else {
      // Remove old reaction if exists
      if (myReaction) {
        await this.chatService.removeReaction(messageId, myReaction.reactionType).toPromise();
        msg.reactions = (msg.reactions ?? []).filter((r: any) => !(r.userId === this.currentUserId));
      }
      // Add new reaction
      try {
        await this.chatService.addReaction(messageId, emoji).toPromise();
        // Reload reactions for this message
        msg.reactions = await this.chatService.getMessageReactions(messageId).toPromise();
      } catch (err) {
        Swal.fire('Error', 'Failed to add reaction.', 'error');
      }
    }
    this.showEmojiPicker[messageId] = false;
  }

  async removeReaction(messageId: number, emoji: string) {
    try {
      await this.chatService.removeReaction(messageId, emoji).toPromise();
      await this.loadMessages();
    } catch (err) {
      Swal.fire('Error', 'Failed to remove reaction.', 'error');
    }
  }

  // --- EDIT MESSAGE ---
  startEditMessage(message: ChatMessage) {
    this.editingMessageId = message.messageId;
    this.editedMessageText = message.messageText;
  }

  async saveEditMessage(message: ChatMessage) {
    try {
      await this.chatService.editMessage(message.messageId, this.editedMessageText).toPromise();
      await this.loadMessages();
      this.editingMessageId = null;
    } catch (err) {
      Swal.fire('Error', 'Failed to edit message.', 'error');
    }
  }

  cancelEditMessage() {
    this.editingMessageId = null;
    this.editedMessageText = '';
  }

  // --- DELETE MESSAGE ---
  async deleteMessage(message: ChatMessage) {
    const result = await Swal.fire({
      title: 'Delete message?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Delete'
    });
    
    if (result.isConfirmed) {
      try {
        console.log('🗑️ Deleting message:', message.messageId);

        await this.chatService.deleteMessage(message.messageId).toPromise();
        
        console.log('✅ Message deleted successfully');
        
        // Update UI immediately
        const messageIndex = this.messages.findIndex(m => m.messageId === message.messageId);
        if (messageIndex > -1) {
          this.messages.splice(messageIndex, 1);
          console.log('✅ Message removed from UI');
        }
        
        // Update conversation last message if needed
        this.updateConversationLastMessage();
        
        // Show success notification
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Message has been deleted successfully.',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
          
      } catch (err: any) {
        console.error('❌ Error deleting message:', err);
        
        const errorMessage = err?.error?.message || err?.message || 'Failed to delete message';
        
        Swal.fire({
          icon: 'error',
          title: 'Failed to Delete',
          text: errorMessage,
          confirmButtonColor: '#0a2e65'
        });
      }
    }
  }

  private async loadMessages(): Promise<void> {
    if (!this.selectedConversation) return;

    try {
      const messages = await this.chatService.getChatHistory(this.selectedConversation.bookingId).toPromise() || [];
      await Promise.all(messages.map(async (msg) => {
        msg.reactions = await this.chatService.getMessageReactions(msg.messageId).toPromise();
      }));
      this.messages = messages;
      this.shouldScrollToBottom = true;

      // Debug: Log all transcripts for voice messages
      console.log('🔊 Voice message transcripts:');
      this.messages.forEach(msg => {
        if (msg.isVoiceMessage) {
          console.log(`Message ID: ${msg.messageId}, transcriptText:`, msg.transcriptText);
        }
      });
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
    if (!conversation) return this.getDefaultAvatarPath();
    
    let profilePicUrl = '';
    
    // Show the OTHER participant's profile picture
    if (this.currentUserId === conversation.mentorId) {
      // You are the mentor, show the mentee's picture
      profilePicUrl = conversation.menteeProfilePicture || '';
    } else {
      // You are the mentee, show the mentor's picture
      profilePicUrl = conversation.mentorProfilePicture || '';
    }
    
    // Process the URL properly
    if (profilePicUrl && profilePicUrl.trim() !== '') {
      // If it's already a full URL, return it
      if (profilePicUrl.startsWith('http')) {
        return profilePicUrl;
      }
      
      // If it's a path that doesn't start with slash, add it
      if (!profilePicUrl.startsWith('/')) {
        profilePicUrl = '/' + profilePicUrl;
      }
      
      // If it's a relative path, make it absolute using environment.apiUrl
      if (!profilePicUrl.includes(this.apiUrl) && profilePicUrl.startsWith('/')) {
        // Don't add apiUrl if it's just a local path to /images folder
        if (!profilePicUrl.startsWith('/images')) {
          return this.apiUrl + profilePicUrl;
        }
      }
      
      return profilePicUrl;
    }
    
    return this.getDefaultAvatarPath();
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

  openAttachmentInNewTab(messageId: number, fileName: string): void {
    this.chatService.downloadAttachment(messageId).subscribe({
      next: (blob: Blob) => {
        // Try to detect PDF and set correct MIME type
        let fileType = '';
        if (fileName.toLowerCase().endsWith('.pdf')) {
          fileType = 'application/pdf';
        } else if (fileName.toLowerCase().endsWith('.docx')) {
          fileType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        } else if (fileName.toLowerCase().endsWith('.doc')) {
          fileType = 'application/msword';
        } else if (fileName.toLowerCase().endsWith('.jpg') || fileName.toLowerCase().endsWith('.jpeg')) {
          fileType = 'image/jpeg';
        } else if (fileName.toLowerCase().endsWith('.png')) {
          fileType = 'image/png';
        } else if (fileName.toLowerCase().endsWith('.gif')) {
          fileType = 'image/gif';
        }
        const typedBlob = fileType ? new Blob([blob], { type: fileType }) : blob;
        const url = window.URL.createObjectURL(typedBlob);
        const newTab = window.open(url, '_blank');
        if (!newTab) {
          this.downloadAttachment(messageId, fileName);
          Swal.fire({
            icon: 'info',
            title: 'Popup Blocked',
            text: 'Your browser blocked the popup. The file will download instead.',
            confirmButtonColor: '#0a2e65'
          });
        } else {
          setTimeout(() => {
            window.URL.revokeObjectURL(url);
          }, 1000);
        }
      },
      error: (error: any) => {
        console.error('Error opening attachment:', error);
        Swal.fire({
          icon: 'error',
          title: 'Failed to Open',
          text: 'Unable to open the file. Please try downloading instead.',
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

  // 2. Add a debug method to check SignalR connection state
  checkSignalRConnection(): void {
    alert('SignalR state: ' + this.signalrService.getConnectionState());
  }

  getMyReaction(message: any): any | undefined {
    return message.reactions?.find((r: any) => r.userId === this.currentUserId);
  }

  // Helper method to get file icon class
  getFileIconClass(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return 'pdf-icon';
      case 'doc':
      case 'docx':
        return 'word-icon';
      case 'xls':
      case 'xlsx':
        return 'excel-icon';
      case 'ppt':
      case 'pptx':
        return 'powerpoint-icon';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'svg':
        return 'image-icon';
      default:
        return 'generic-icon';
    }
  }

  // Helper method to get file icon
  getFileIcon(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return 'fas fa-file-pdf';
      case 'doc':
      case 'docx':
        return 'fas fa-file-word';
      case 'xls':
      case 'xlsx':
        return 'fas fa-file-excel';
      case 'ppt':
      case 'pptx':
        return 'fas fa-file-powerpoint';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'svg':
        return 'fas fa-file-image';
      case 'zip':
      case 'rar':
      case '7z':
        return 'fas fa-file-archive';
      case 'txt':
        return 'fas fa-file-alt';
      default:
        return 'fas fa-file';
    }
  }

  // Helper method to format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  onImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    console.log('Image failed to load:', imgElement.src);
    imgElement.src = this.getDefaultAvatarPath();
    
    // Add onerror=null to prevent infinite error loop if default image also fails
    imgElement.onerror = null;
  }

  // Debugging: Log messages on every change
  ngDoCheck() {
    console.log('🟦 Message debug:', JSON.stringify(this.messages, null, 2));
  }
}
