import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../environments/environment.development';
import { ChatMessage } from '../Models/Chat/chat-message';

@Injectable({
  providedIn: 'root'
})
export class SignalrChatService {
  private hubConnection: HubConnection | undefined;
  private connectionState = new BehaviorSubject<string>('Disconnected');

  // Observables for real-time events
  private messageReceived = new BehaviorSubject<ChatMessage | null>(null);
  private messageRead = new BehaviorSubject<{messageId: number, userId: number} | null>(null);
  private userTyping = new BehaviorSubject<{bookingId: number, userId: number, isTyping: boolean} | null>(null);
  private userOnline = new BehaviorSubject<{userId: number, isOnline: boolean} | null>(null);

  constructor() { }

  // Start SignalR connection
  startConnection(token: string): Promise<void> {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(`${environment.apiUrl}/chatHub`, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    this.setupEventListeners();

    return this.hubConnection.start()
      .then(() => {
        console.log('SignalR Connected');
        this.connectionState.next('Connected');
      })
      .catch(err => {
        console.error('SignalR Connection Error:', err);
        this.connectionState.next('Error');
        throw err;
      });
  }

  // Stop SignalR connection
  stopConnection(): Promise<void> {
    if (this.hubConnection) {
      return this.hubConnection.stop().then(() => {
        this.connectionState.next('Disconnected');
      });
    }
    return Promise.resolve();
  }

  // Setup event listeners
  private setupEventListeners(): void {
    if (!this.hubConnection) return;

    this.hubConnection.on('ReceiveMessage', (message: ChatMessage) => {
      this.messageReceived.next(message);
    });

    this.hubConnection.on('MessageRead', (data: {messageId: number, userId: number}) => {
      this.messageRead.next(data);
    });

    this.hubConnection.on('UserTyping', (data: {bookingId: number, userId: number, isTyping: boolean}) => {
      this.userTyping.next(data);
    });

    this.hubConnection.on('UserOnline', (data: {userId: number, isOnline: boolean}) => {
      this.userOnline.next(data);
    });

    this.hubConnection.on('UserOffline', (data: {userId: number, isOnline: boolean}) => {
      this.userOnline.next(data);
    });
  }

  // Join booking chat
  joinBookingChat(bookingId: number): Promise<void> {
    if (this.hubConnection && this.hubConnection.state === 'Connected') {
      return this.hubConnection.invoke('JoinBookingChat', bookingId);
    }
    return Promise.reject('Connection not established');
  }

  // Leave booking chat
  leaveBookingChat(bookingId: number): Promise<void> {
    if (this.hubConnection && this.hubConnection.state === 'Connected') {
      return this.hubConnection.invoke('LeaveBookingChat', bookingId);
    }
    return Promise.reject('Connection not established');
  }

  // Send typing indicator
  sendTypingIndicator(bookingId: number, isTyping: boolean): Promise<void> {
    if (this.hubConnection && this.hubConnection.state === 'Connected') {
      return this.hubConnection.invoke('SendTypingIndicator', bookingId, isTyping);
    }
    return Promise.reject('Connection not established');
  }

  // Observables for components
  get connectionState$(): Observable<string> {
    return this.connectionState.asObservable();
  }

  get messageReceived$(): Observable<ChatMessage | null> {
    return this.messageReceived.asObservable();
  }

  get messageRead$(): Observable<{messageId: number, userId: number} | null> {
    return this.messageRead.asObservable();
  }

  get userTyping$(): Observable<{bookingId: number, userId: number, isTyping: boolean} | null> {
    return this.userTyping.asObservable();
  }

  get userOnline$(): Observable<{userId: number, isOnline: boolean} | null> {
    return this.userOnline.asObservable();
  }

  // Get connection status
  getConnectionState(): string {
    return this.hubConnection?.state || 'Disconnected';
  }
}
