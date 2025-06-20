import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../environments/environment.development';
import { ChatMessage } from '../Models/Chat/chat-message';
import { ChatConversation } from '../Models/Chat/chat-conversation';
import { ConversationParticipants } from '../Models/Chat/conversation-participants';
import { SendMessageRequest } from '../Models/Chat/send-message-request';
import { TypingIndicatorRequest } from '../Models/Chat/typing-indicator-request';
import { MessageReaction } from '../Models/Chat/message-reaction';
import { OnlineStatus } from '../Models/Chat/online-status';
import { ChatSearchResults } from '../Models/Chat/search-results';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Get chat history for a booking
  getChatHistory(bookingId: number): Observable<ChatMessage[]> {
    return this.http.get<{success: boolean, data: ChatMessage[]}>(`${this.apiUrl}/chat/${bookingId}`)
      .pipe(map(response => response.data));
  }

  // Send a new message
  sendMessage(request: SendMessageRequest): Observable<ChatMessage> {
    return this.http.post<{success: boolean, message: string, data: ChatMessage}>(`${this.apiUrl}/chat`, request)
      .pipe(map(response => response.data));
  }

  // Get unread message count
  getUnreadCount(): Observable<number> {
    return this.http.get<{success: boolean, count: number}>(`${this.apiUrl}/chat/unread-count`)
      .pipe(map(response => response.count));
  }

  // Mark message as read
  markMessageAsRead(messageId: number): Observable<void> {
    return this.http.put<{success: boolean, message: string}>(`${this.apiUrl}/chat/${messageId}/read`, {})
      .pipe(map(() => void 0));
  }

  // Upload attachment
  uploadAttachment(bookingId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('bookingId', bookingId.toString());
    formData.append('file', file);

    return this.http.post<{success: boolean, message: string, data: any}>(`${this.apiUrl}/chat/attachment`, formData)
      .pipe(map(response => response.data));
  }

  // Get user conversations
  getConversations(): Observable<ChatConversation[]> {
    return this.http.get<{success: boolean, data: ChatConversation[]}>(`${this.apiUrl}/chat/conversations`)
      .pipe(map(response => response.data));
  }

  // Get conversation participants
  getConversationParticipants(bookingId: number): Observable<ConversationParticipants> {
    return this.http.get<{success: boolean, data: ConversationParticipants}>(`${this.apiUrl}/chat/conversation/${bookingId}/participants`)
      .pipe(map(response => response.data));
  }

  // Mark all messages as read
  markAllMessagesAsRead(bookingId: number): Observable<void> {
    return this.http.put<{success: boolean, message: string}>(`${this.apiUrl}/chat/conversation/${bookingId}/read-all`, {})
      .pipe(map(() => void 0));
  }

  // Download attachment
  downloadAttachment(messageId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/chat/attachments/${messageId}`, { responseType: 'blob' });
  }

  // Delete message
  deleteMessage(messageId: number): Observable<void> {
    return this.http.delete<{success: boolean, message: string}>(`${this.apiUrl}/chat/messages/${messageId}`)
      .pipe(map(() => void 0));
  }

  // Send typing indicator
  sendTypingIndicator(request: TypingIndicatorRequest): Observable<void> {
    return this.http.post<{success: boolean, message: string}>(`${this.apiUrl}/chat/typing`, request)
      .pipe(map(() => void 0));
  }

  // Search messages
  searchMessages(bookingId: number, query: string, limit: number = 50): Observable<ChatMessage[]> {
    const params = new HttpParams()
      .set('query', query)
      .set('limit', limit.toString());

    return this.http.get<{success: boolean, data: ChatMessage[]}>(`${this.apiUrl}/chat/search/${bookingId}`, { params })
      .pipe(map(response => response.data));
  }

  // Edit message
  editMessage(messageId: number, messageText: string): Observable<ChatMessage> {
    return this.http.put<{success: boolean, message: string, data: ChatMessage}>(`${this.apiUrl}/chat/messages/${messageId}`, {
      messageId,
      messageText
    }).pipe(map(response => response.data));
  }

  // Add reaction
  addReaction(messageId: number, reactionType: string): Observable<MessageReaction> {
    return this.http.post<{success: boolean, data: MessageReaction}>(`${this.apiUrl}/chat/messages/${messageId}/reaction`, {
      messageId,
      reactionType
    }).pipe(map(response => response.data));
  }

  // Remove reaction
  removeReaction(messageId: number, reactionType: string): Observable<void> {
    const params = new HttpParams().set('reactionType', reactionType);
    return this.http.delete<{success: boolean, message: string}>(`${this.apiUrl}/chat/messages/${messageId}/reaction`, { params })
      .pipe(map(() => void 0));
  }

  // Upload voice message
  uploadVoiceMessage(bookingId: number, audioFile: File): Observable<ChatMessage> {
    const formData = new FormData();
    formData.append('bookingId', bookingId.toString());
    formData.append('audioFile', audioFile);

    return this.http.post<{success: boolean, message: string, data: ChatMessage}>(`${this.apiUrl}/chat/voice-message`, formData)
      .pipe(map(response => response.data));
  }

  // Get online status
  getOnlineStatus(bookingId: number): Observable<OnlineStatus> {
    return this.http.get<{success: boolean, data: OnlineStatus}>(`${this.apiUrl}/chat/conversation/${bookingId}/online-status`)
      .pipe(map(response => response.data));
  }
}
