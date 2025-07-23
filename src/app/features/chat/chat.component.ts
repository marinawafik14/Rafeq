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
import { TokenResponseDto } from '../../Models/Auth/TokenResponseDto';
import { Subject, takeUntil } from 'rxjs';
@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, VoiceMessageComponent],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  menteeId: number | null = null;
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;

  
  conversations: ChatConversation[] = [];
  messages: ChatMessage[] = [];
  selectedConversation: ChatConversation | null = null;
  participants: ConversationParticipants | null = null;
  currentUserId: number = 0;
  currentUser: TokenResponseDto | null = null;
    private destroy = new Subject<void>();

  isLoading = true;
  isLoadingMessages = false;
  isSending = false;
  error: string | null = null;
  searchQuery = '';
  
  
  newMessage = '';
  selectedFile: File | null = null;
  
  private subscriptions: Subscription[] = [];
  typingUsers: {[userId: number]: boolean} = {};
  
  private shouldScrollToBottom = true;

  private lastLoadTime = 0;
  private readonly LOAD_THROTTLE_MS = 2000; 

  isRecording = false;
  isUploadingVoice = false;
  recordingDuration = 0;
  audioChunks: Blob[] = [];
  mediaRecorder: any = null;
  recordingTimer: any = null;

  showEmojiPicker: { [messageId: number]: boolean } = {};
  emojiList: string[] = ['👍', '❤️', '😂', '😮', '😢', '👏'];

  editingMessageId: number | null = null;
  editedMessageText: string = '';

  private apiUrl = environment.apiUrl;

  constructor(
    private chatService: ChatService,
    private signalrService: SignalrChatService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private profileService: ProfileService 
  ) {
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.currentUserId = currentUser.userId || 0;
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
    this.authService.currentUser
      .pipe(takeUntil(this.destroy))
      .subscribe(user => {
        this.currentUser = user;
      });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.signalrService.stopConnection();
    this.destroy.next();
    this.destroy.complete();
  }
 goToDashboard() {
    if (!this.currentUser || !this.currentUser.role) return;
    if (this.currentUser.role === 'Mentee') {
      this.router.navigate(['/mentee/dashboard']);
    } else if (this.currentUser.role === 'Mentor') {
      this.router.navigate(['/mentor/dashboard']);
    }else if (this.currentUser.role === 'Admin') {
      this.router.navigate(['/admin/charts']);
    }
    
    else {
      this.router.navigate(['/home']);
    }
  }
  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
    }
  }

  async initializeChat(): Promise<void> {
    try {
      await this.loadConversations();

      const token = this.authService.getToken();
      if (token) {
        try {
          this.subscriptions.push(
            this.signalrService.initializeConnection().subscribe(status => {
              console.log('🔗 SignalR status changed:', status);
              
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

    const messageReceivedSub = this.signalrService.messageReceived$.subscribe(message => {
      console.log('📨 SignalR: New message received:', message);
      
      if (message && this.selectedConversation && message.senderId !== this.currentUserId) {
        if (message.bookingId === this.selectedConversation.bookingId) {
          console.log('➕ Adding message from other user to current conversation');
          this.messages.push(message);
          this.shouldScrollToBottom = true;
          
          this.markMessageAsRead(message.messageId);
        }
        
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

    const messageDeletedSub = this.signalrService.messageDeleted$.subscribe(data => {
      console.log('🗑️ SignalR: Message deleted event received:', data);
      
      if (data && this.messages) {
        let messageIdToDelete = data.messageId;
        let bookingIdToCheck = data.bookingId;
        
        if (bookingIdToCheck === 0 && this.selectedConversation) {
          bookingIdToCheck = this.selectedConversation.bookingId;
        }
        
        console.log(`🗑️ Attempting to delete message ${messageIdToDelete} from booking ${bookingIdToCheck}`);
        
        if (!this.selectedConversation || bookingIdToCheck === this.selectedConversation.bookingId) {
          const messageIndex = this.messages.findIndex(m => m.messageId === messageIdToDelete);
          if (messageIndex > -1) {
            console.log('✅ Removing message from UI via SignalR');
            this.messages.splice(messageIndex, 1);
            
            this.updateConversationLastMessage();
          } else {
            console.log('⚠️ Message not found in current messages list');
          }
        }
      }
    });

    const messageEditedSub = this.signalrService.messageEdited$.subscribe(editedMessage => {
      console.log('✏️ SignalR: Message edited event received:', editedMessage);
      
      if (editedMessage && this.messages && editedMessage.senderId !== this.currentUserId) {
        const messageIndex = this.messages.findIndex(m => m.messageId === editedMessage.messageId);
        if (messageIndex > -1) {
          console.log('✅ Updating message from other user via SignalR');
          this.messages[messageIndex] = { ...this.messages[messageIndex], ...editedMessage };
          
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

  async selectConversation(conversation: ChatConversation): Promise<void> {
    console.log('🔗 Selecting conversation:', conversation.bookingId);

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
      console.log('📥 Loading messages for booking:', conversation.bookingId);
      const messages = await this.chatService.getChatHistory(conversation.bookingId).toPromise() || [];
      
      console.log('📨 Messages loaded from API:', messages.length);
      console.log('📋 Message details:', messages);

      if (messages.length > 0) {
        await Promise.all(messages.map(async (msg) => {
          msg.reactions = await this.chatService.getMessageReactions(msg.messageId).toPromise();
        }));
        this.messages = messages;
      } else {
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

     
      try {
        const participantsData = await this.chatService.getConversationParticipants(conversation.bookingId).toPromise();
        this.participants = participantsData || null; 
        console.log('👥 Participants loaded:', this.participants);
      } catch (participantError) {
        console.warn('⚠️ Could not load participants:', participantError);
        this.participants = null; 
      }

      this.shouldScrollToBottom = true;
      this.isLoadingMessages = false;

     
      this.router.navigate(['/chat', conversation.bookingId], { replaceUrl: true });

      
      console.log('🔍 Selected conversation data:', {
        bookingId: conversation.bookingId,
        sessionType: conversation.sessionType,
        sessionStatus: conversation.sessionStatus,
        mentorName: conversation.mentorName,
        menteeName: conversation.menteeName,
        totalMessages: this.messages.length
      });

     
      if (this.messages && this.messages.length > 0) {
        this.messages.forEach(msg => {
          if (!msg.isRead && msg.senderId !== this.currentUserId) {
            this.markMessageAsRead(msg.messageId);
            msg.isRead = true; 
          }
        });
      }

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

        this.newMessage = '';
        this.selectedFile = null;

        setTimeout(async () => {
          console.log('🔄 Refreshing conversation after send...');
          await this.selectConversation(this.selectedConversation!);
          await this.loadConversations(); 
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
        await this.loadMessages();
      }

      this.selectedFile = null;
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

  toggleEmojiPicker(messageId: number) {
    this.showEmojiPicker[messageId] = !this.showEmojiPicker[messageId];
  }

  async addReaction(messageId: number, emoji: string): Promise<void> {
    const msg = this.messages.find(m => m.messageId === messageId);
    if (!msg) return;

    const myReaction = this.getMyReaction(msg);

    if (myReaction && myReaction.reactionType === emoji) {
      try {
        await this.chatService.removeReaction(messageId, emoji).toPromise();
        msg.reactions = (msg.reactions ?? []).filter((r: any) => !(r.userId === this.currentUserId && r.reactionType === emoji));
      } catch (err) {
        Swal.fire('Error', 'Failed to remove reaction.', 'error');
      }
    } else {
      if (myReaction) {
        await this.chatService.removeReaction(messageId, myReaction.reactionType).toPromise();
        msg.reactions = (msg.reactions ?? []).filter((r: any) => !(r.userId === this.currentUserId));
      }
      try {
        await this.chatService.addReaction(messageId, emoji).toPromise();
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
        
        const messageIndex = this.messages.findIndex(m => m.messageId === message.messageId);
        if (messageIndex > -1) {
          this.messages.splice(messageIndex, 1);
          console.log('✅ Message removed from UI');
        }
        
        this.updateConversationLastMessage();
        
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

  isMyMessage(message: ChatMessage): boolean {
    return message.senderId === this.currentUserId;
  }

  openGoogleMeet(link: string | undefined): void {
    if (link) {
      window.open(link, '_blank');
    } else {
      console.warn('No Google Meet link available');
    }
  }

  formatMessageTime(date: Date | string | null | undefined): string {
    if (!date) return '';
    
    try {
      const messageDate = new Date(date);
      
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

  getUserName(conversation: ChatConversation): string {
    if (this.currentUserId === conversation.mentorId) {
      return conversation.menteeName;
    } else {
      return conversation.mentorName;
    }
  }

  getUserProfilePicture(conversation: ChatConversation): string {
    if (!conversation) return this.getDefaultAvatarPath();
    
    let profilePicUrl = '';
    
    if (this.currentUserId === conversation.mentorId) {
      profilePicUrl = conversation.menteeProfilePicture || '';
    } else {
      profilePicUrl = conversation.mentorProfilePicture || '';
    }
    
    if (profilePicUrl && profilePicUrl.trim() !== '') {
      if (profilePicUrl.startsWith('http')) {
        return profilePicUrl;
      }
      
      if (!profilePicUrl.startsWith('/')) {
        profilePicUrl = '/' + profilePicUrl;
      }
      
      if (!profilePicUrl.includes(this.apiUrl) && profilePicUrl.startsWith('/')) {
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
    
    if (this.currentUserId === this.participants.mentor.userId) {
      return this.participants.mentee;
    } else {
      return this.participants.mentor;
    }
  }

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
    
    alert(`Debug Info:
Current User ID: ${this.currentUserId}
Mentor ID: ${conversation.mentorId} (${conversation.mentorName})
Mentee ID: ${conversation.menteeId} (${conversation.menteeName})

You are the: ${this.currentUserId === conversation.mentorId ? 'MENTOR' : 'MENTEE'}
You should see: ${this.getUserName(conversation)}`);
  }

  async refreshConversations(): Promise<void> {
    console.log('🔄 Manual refresh triggered...');
    this.lastLoadTime = 0;
    await this.loadConversations();
    
    if (this.selectedConversation) {
      const currentBookingId = this.selectedConversation.bookingId;
      const conversation = this.conversations.find(c => c.bookingId === currentBookingId);
      if (conversation) {
        await this.selectConversation(conversation);
      }
    }
    
    console.log('✅ Refresh completed');
  }

  checkSignalRConnection(): void {
    alert('SignalR state: ' + this.signalrService.getConnectionState());
  }

  getMyReaction(message: any): any | undefined {
    return message.reactions?.find((r: any) => r.userId === this.currentUserId);
  }

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
    
    imgElement.onerror = null;
  }

  ngDoCheck() {
    console.log('🟦 Message debug:', JSON.stringify(this.messages, null, 2));
  }
}
