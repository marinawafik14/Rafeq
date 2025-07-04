import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
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
  providedIn: 'root',
})
export class ChatService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getChatHistory(bookingId: number): Observable<ChatMessage[]> {
    return this.http
      .get<{ success: boolean; data: ChatMessage[] }>(
        `${this.apiUrl}/chat/${bookingId}`
      )
      .pipe(
        map((response) => response.data || []),
        catchError((error) => {
          console.error('Error fetching chat history:', error);
          return of([]);
        })
      );
  }

  sendMessage(request: SendMessageRequest): Observable<ChatMessage> {
    return this.http
      .post<{ success: boolean; message: string; data: ChatMessage }>(
        `${this.apiUrl}/chat`,
        request
      )
      .pipe(
        map((response) => response.data),
        catchError((error) => {
          console.error('Error sending message:', error);
          throw error;
        })
      );
  }

  uploadAttachment(bookingId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('bookingId', bookingId.toString());
    formData.append('file', file);

    return this.http
      .post<{ success: boolean; message: string; data: any }>(
        `${this.apiUrl}/chat/attachment`,
        formData
      )
      .pipe(
        map((response) => response.data),
        catchError((error) => {
          console.error('Error uploading attachment:', error);
          throw error;
        })
      );
  }

  // Update getConversations to be more resilient
  getConversations(): Observable<ChatConversation[]> {
    return this.http
      .get<{ success: boolean; data: ChatConversation[] }>(
        `${this.apiUrl}/chat/conversations`
      )
      .pipe(
        map((response) => {
          console.log('✅ Existing conversations response:', response);
          return response.data || [];
        }),
        catchError((error) => {
          console.warn(
            '⚠️ Could not load existing conversations, using empty array:',
            error
          );
          return of([]); // Return empty array instead of failing
        })
      );
  }

  getPotentialConversations(): Observable<ChatConversation[]> {
    return this.http
      .get<{ success: boolean; data: ChatConversation[] }>(
        `${this.apiUrl}/chat/potential-conversations`
      )
      .pipe(
        map((response) => {
          console.log('✅ Potential conversations response:', response);
          return response.data || [];
        }),
        catchError((error) => {
          console.error('❌ Error fetching potential conversations:', error);
          return of([]);
        })
      );
  }

  markMessageAsRead(messageId: number): Observable<void> {
    return this.http
      .put<{ success: boolean; message: string }>(
        `${this.apiUrl}/chat/${messageId}/read`,
        {}
      )
      .pipe(
        map(() => void 0),
        catchError((error) => {
          console.error('Error marking message as read:', error);
          return of(void 0);
        })
      );
  }

  getConversationParticipants(
    bookingId: number
  ): Observable<ConversationParticipants> {
    return this.http
      .get<{ success: boolean; data: ConversationParticipants }>(
        `${this.apiUrl}/chat/conversation/${bookingId}/participants`
      )
      .pipe(
        map((response) => response.data),
        catchError((error) => {
          console.error('Error fetching participants:', error);
          throw error;
        })
      );
  }

  markAllMessagesAsRead(bookingId: number): Observable<void> {
    return this.http
      .put<{ success: boolean; message: string }>(
        `${this.apiUrl}/chat/conversation/${bookingId}/read-all`,
        {}
      )
      .pipe(
        map(() => void 0),
        catchError((error) => {
          console.error('Error marking messages as read:', error);
          return of(void 0);
        })
      );
  }

  downloadAttachment(messageId: number): Observable<Blob> {
    return this.http
      .get(`${this.apiUrl}/chat/attachments/${messageId}`, {
        responseType: 'blob',
      })
      .pipe(
        catchError((error) => {
          console.error('Error downloading attachment:', error);
          throw error;
        })
      );
  }

  // Update this method to be the primary conversation loader
  getAllConversations(): Observable<ChatConversation[]> {
    console.log('🔄 Starting getAllConversations...');
    
    return forkJoin({
      existing: this.getConversations(),
      potential: this.getPotentialConversations(),
    }).pipe(
      map(({ existing, potential }) => {
        console.log('📊 === CONVERSATION FILTERING DEBUG ===');
        console.log('📊 Raw existing conversations:', existing.length);
        console.log('📊 Raw potential conversations:', potential.length);

        // Log ALL statuses with details
        console.log('📊 EXISTING CONVERSATIONS:');
        existing.forEach((conv, index) => {
          console.log(`  [${index}] ID: ${conv.bookingId}, Status: "${conv.sessionStatus}", Type: ${typeof conv.sessionStatus}`);
        });

        console.log('📊 POTENTIAL CONVERSATIONS:');
        potential.forEach((conv, index) => {
          console.log(`  [${index}] ID: ${conv.bookingId}, Status: "${conv.sessionStatus}", Type: ${typeof conv.sessionStatus}`);
        });

        // Filter existing conversations to only include allowed statuses
        console.log('🔍 FILTERING EXISTING CONVERSATIONS:');
        const filteredExisting = existing.filter((conv, index) => {
          console.log(`\n--- Filtering existing conversation ${index} ---`);
          console.log(`  Booking ID: ${conv.bookingId}`);
          console.log(`  Status: "${conv.sessionStatus}"`);
          const allowed = this.shouldAllowChat(conv.sessionStatus);
          console.log(`  Decision: ${allowed ? 'ALLOWED' : 'REJECTED'}`);
          
          if (!allowed) {
            console.log('🚫 FILTERING OUT existing conversation:', conv.bookingId, 'status:', conv.sessionStatus);
          }
          return allowed;
        });

        console.log('📊 Filtered existing count:', filteredExisting.length);

        // Use filtered existing instead of raw existing
        const allConversations = [...filteredExisting];
        const existingBookingIds = new Set(filteredExisting.map((c) => c.bookingId));

        console.log('🔍 FILTERING POTENTIAL CONVERSATIONS:');
        // Add potential conversations that aren't already in existing
        potential.forEach((p, index) => {
          console.log(`\n--- Filtering potential conversation ${index} ---`);
          console.log(`  Booking ID: ${p.bookingId}`);
          console.log(`  Status: "${p.sessionStatus}"`);
          console.log(`  Already exists: ${existingBookingIds.has(p.bookingId)}`);
          
          if (!existingBookingIds.has(p.bookingId)) {
            const allowed = this.shouldAllowChat(p.sessionStatus);
            console.log(`  Decision: ${allowed ? 'ALLOWED' : 'REJECTED'}`);
            
            if (allowed) {
              allConversations.push(p);
              console.log('✅ ADDED potential conversation:', p.bookingId);
            } else {
              console.log('🚫 FILTERING OUT potential conversation:', p.bookingId, 'status:', p.sessionStatus);
            }
          } else {
            console.log('⏭️ SKIPPED (already exists)');
          }
        });

        // Remove duplicates and sort
        const uniqueConversations = allConversations.filter(
          (conversation, index, self) =>
            index ===
            self.findIndex((c) => c.bookingId === conversation.bookingId)
        );

        console.log('📊 === FINAL RESULTS ===');
        console.log('📊 Final filtered conversations:', uniqueConversations.length);
        console.log('📊 Final conversation details:');
        uniqueConversations.forEach((conv, index) => {
          console.log(`  [${index}] ID: ${conv.bookingId}, Status: "${conv.sessionStatus}"`);
        });
        console.log('📊 Total filtered out:', existing.length + potential.length - uniqueConversations.length);

        // Double-check for any cancelled/pending that slipped through
        const problematicConversations = uniqueConversations.filter(conv => {
          const status = conv.sessionStatus?.toLowerCase().trim();
          return status === 'cancelled' || status === 'pending';
        });

        if (problematicConversations.length > 0) {
          console.error('🚨 ALERT: Found problematic conversations that should have been filtered:');
          problematicConversations.forEach(conv => {
            console.error(`  🚨 ID: ${conv.bookingId}, Status: "${conv.sessionStatus}"`);
          });
        }

        return uniqueConversations.sort(
          (a, b) =>
            new Date(b.lastMessageAt).getTime() -
            new Date(a.lastMessageAt).getTime()
        );
      }),
      catchError((error) => {
        console.error('Error in getAllConversations:', error);
        return of([]);
      })
    );
  }

  // Update shouldAllowChat to handle all possible status variations
  private shouldAllowChat(sessionStatus?: string): boolean {
    console.log('🔍 DETAILED STATUS CHECK:');
    console.log('  Raw status:', sessionStatus);
    console.log('  Type:', typeof sessionStatus);
    console.log('  Is null/undefined:', sessionStatus == null);
    
    if (!sessionStatus) {
      console.log('  ❌ REJECTED: Status is null/undefined');
      return false; // Don't allow if status is unknown
    }
    
    const normalizedStatus = sessionStatus.toLowerCase().trim();
    console.log('  Normalized status:', normalizedStatus);
    
    // Based on your codebase, these are the statuses that should allow chat
    const allowedStatuses = [
      'confirmed',
      'inprogress', 
      'in-progress',
      'completed',
      'upcoming',    // Sometimes used for confirmed sessions
      'scheduled'    // Sometimes used for confirmed sessions
    ];
    
    console.log('  Allowed statuses:', allowedStatuses);
    const allowed = allowedStatuses.includes(normalizedStatus);
    console.log('  ✅ Status allowed:', allowed);
    
    // Log specific rejections
    if (!allowed) {
      console.log('  🚫 REJECTED STATUS:', normalizedStatus);
      console.log('  🚫 This status should be filtered out');
    }
    
    return allowed;
  }

  // 1. Upload voice message
  uploadVoiceMessage(
    bookingId: number,
    audioFile: File
  ): Observable<ChatMessage> {
    const formData = new FormData();
    formData.append('bookingId', bookingId.toString());
    formData.append('audioFile', audioFile);

    return this.http.post<any>(
      `${environment.apiUrl}/chat/voice-message`,
      formData
    );
  }

  // 2. Add reaction
  addReaction(messageId: number, reactionType: string): Observable<any> {
    return this.http.post<any>(
      `${environment.apiUrl}/chat/messages/${messageId}/reaction`,
      { messageId, reactionType }
    );
  }

  // 3. Remove reaction
  removeReaction(messageId: number, reactionType: string): Observable<any> {
    const params = new HttpParams().set('reactionType', reactionType);
    return this.http.delete<any>(
      `${environment.apiUrl}/chat/messages/${messageId}/reaction`,
      { params }
    );
  }

  // 4. Get reactions for a message
  getMessageReactions(messageId: number): Observable<any[]> {
    return this.http
      .get<{ success: boolean; data: any[] }>(
        `${this.apiUrl}/chat/messages/${messageId}/reactions`
      )
      .pipe(
        map((response) => response.data || []),
        catchError((error) => {
          console.error('Error fetching reactions:', error);
          return of([]);
        })
      );
  }

  // 5. Edit message
  editMessage(messageId: number, messageText: string): Observable<ChatMessage> {
    return this.http.put<any>(
      `${environment.apiUrl}/chat/messages/${messageId}`,
      { messageId, messageText }
    );
  }

  // 6. Delete message
  deleteMessage(messageId: number): Observable<any> {
    return this.http.delete<any>(
      `${environment.apiUrl}/chat/messages/${messageId}`
    );
  }

  // Add this method for voice message info (if not already present)
  async getVoiceMessageInfo(fileName: string): Promise<any> {
    try {
      const response = await this.http
        .get<any>(`${this.apiUrl}/chat/voice-info/${fileName}`)
        .toPromise();
      return response;
    } catch (error) {
      console.error('Error fetching voice message info:', error);
      return { exists: false, fileName, fileSize: 0 };
    }
  }

  // Add this method for the stream URL (if not already present)
  getVoiceStreamUrl(fileName: string): string {
    return `${this.apiUrl}/chat/voice/${fileName}`;
  }
}
