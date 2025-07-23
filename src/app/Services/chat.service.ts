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

  getConversations(): Observable<ChatConversation[]> {
    return this.http
      .get<{ success: boolean; data: ChatConversation[] }>(
        `${this.apiUrl}/chat/conversations`
      )
      .pipe(
        map((response) => {
          return response.data || [];
        }),
        catchError((error) => {
        
          return of([]); 
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
          return response.data || [];
        }),
        catchError((error) => {
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
          throw error;
        })
      );
  }

  getAllConversations(): Observable<ChatConversation[]> {
    
    return forkJoin({
      existing: this.getConversations(),
      potential: this.getPotentialConversations(),
    }).pipe(
      map(({ existing, potential }) => {
       
        existing.forEach((conv, index) => {
        
        });

      
        potential.forEach((conv, index) => {
       
        });

       
        const filteredExisting = existing.filter((conv, index) => {
         
          const allowed = this.shouldAllowChat(conv.sessionStatus);
       
          
          if (!allowed) {
          
          }
          return allowed;
        });

       
        const allConversations = [...filteredExisting];
        const existingBookingIds = new Set(filteredExisting.map((c) => c.bookingId));

      
        potential.forEach((p, index) => {
          
          
          if (!existingBookingIds.has(p.bookingId)) {
         
            if (this.shouldAllowChat(p.sessionStatus)) {
              allConversations.push(p);
             
            } else {
           
            }
          } else {
         
          }
        });

      
        const uniqueConversations = allConversations.filter(
          (conversation, index, self) =>
            index ===
            self.findIndex((c) => c.bookingId === conversation.bookingId)
        );

       
        return uniqueConversations.sort(
          (a, b) =>
            new Date(b.lastMessageAt).getTime() -
            new Date(a.lastMessageAt).getTime()
        );
      }),
      catchError((error) => {
       
        return of([]);
      })
    );
  }

 
  private shouldAllowChat(sessionStatus?: string): boolean {
    if (!sessionStatus) return true; 

    const normalizedStatus = sessionStatus.toLowerCase().trim();

   
    const blockedStatuses = ['pending', 'cancelled', 'canceled'];

    const isBlocked = blockedStatuses.includes(normalizedStatus);

   

    return !isBlocked; 
  }

  
  uploadVoiceMessage(
    bookingId: number,
    audioFile: File,
    messageText?: string
  ): Observable<ChatMessage> {
    const formData = new FormData();
    formData.append('BookingId', bookingId.toString());
    formData.append('AudioFile', audioFile);
    if (messageText) formData.append('MessageText', messageText);

    return this.http
      .post<{ success: boolean; data: ChatMessage }>(
        `${this.apiUrl}/voice/upload-message`,
        formData
      )
      .pipe(
        map((response) => {
         
          return response.data;
        }),
        catchError((error) => {
        
          throw error;
        })
      );
  }

  
  addReaction(messageId: number, reactionType: string): Observable<any> {
    return this.http.post<any>(
      `${environment.apiUrl}/chat/messages/${messageId}/reaction`,
      { messageId, reactionType }
    );
  }

 
  removeReaction(messageId: number, reactionType: string): Observable<any> {
    const params = new HttpParams().set('reactionType', reactionType);
    return this.http.delete<any>(
      `${environment.apiUrl}/chat/messages/${messageId}/reaction`,
      { params }
    );
  }


  getMessageReactions(messageId: number): Observable<any[]> {
    return this.http
      .get<{ success: boolean; data: any[] }>(
        `${this.apiUrl}/chat/messages/${messageId}/reactions`
      )
      .pipe(
        map((response) => response.data || []),
        catchError((error) => {
         
          return of([]);
        })
      );
  }


  editMessage(messageId: number, messageText: string): Observable<ChatMessage> {
    return this.http.put<any>(
      `${environment.apiUrl}/chat/messages/${messageId}`,
      { messageId, messageText }
    );
  }

 
  deleteMessage(messageId: number): Observable<any> {
    return this.http.delete<any>(
      `${environment.apiUrl}/chat/messages/${messageId}`
    );
  }

  
  async getVoiceMessageInfo(fileName: string): Promise<any> {
    try {
      const response = await this.http
        .get<any>(`${this.apiUrl}/chat/voice-info/${fileName}`)
        .toPromise();
      return response;
    } catch (error) {
   
      return { exists: false, fileName, fileSize: 0 };
    }
  }

  
  getVoiceStreamUrl(fileName: string): string {
    return `${this.apiUrl}/chat/voice/${fileName}`;
  }
}
