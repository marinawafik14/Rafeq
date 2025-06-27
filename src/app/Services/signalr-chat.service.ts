import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../environments/environment.development';
import { ChatMessage } from '../Models/Chat/chat-message';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SignalrChatService {
  private hubConnection: signalR.HubConnection | undefined;
  private connectionState = new BehaviorSubject<string>('Disconnected');

  // Observables for real-time events
  private messageReceived = new BehaviorSubject<ChatMessage | null>(null);
  private messageRead = new BehaviorSubject<{messageId: number, userId: number} | null>(null);
  private userTyping = new BehaviorSubject<{bookingId: number, userId: number, isTyping: boolean} | null>(null);
  private userOnline = new BehaviorSubject<{userId: number, isOnline: boolean} | null>(null);
  private messageReaction = new BehaviorSubject<any>(null);

  constructor(private authService: AuthService) { }

  // Initialize connection with robust retry logic
  public initializeConnection(): Observable<string> {
    this.createConnection();
    this.startConnection();
    return this.connectionState.asObservable();
  }

  // Create hub connection
  private createConnection(): void {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:7001/chatHub', {
        accessTokenFactory: () => this.authService.getToken() || '',
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000]) // Retry intervals
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.connectionState.next('initialized');
  }

  // Start connection with retry logic
  private startConnection(): void {
    if (!this.hubConnection) return;

    this.connectionState.next('connecting');
    
    this.hubConnection.start()
      .then(() => {
        console.log('✅ SignalR Connected successfully!');
        this.connectionState.next('Connected');
        this.setupEventListeners();
      })
      .catch(err => {
        console.error('❌ Error starting SignalR connection:', err);
        this.connectionState.next('Error');
        // Retry after 5 seconds
        setTimeout(() => this.startConnection(), 5000);
      });

    // Setup automatic reconnection handlers
    this.hubConnection.onclose(error => {
      console.log('SignalR connection closed. Error:', error);
      this.connectionState.next('Disconnected');
    });

    this.hubConnection.onreconnecting(error => {
      console.log('SignalR reconnecting. Error:', error);
      this.connectionState.next('Reconnecting');
    });

    this.hubConnection.onreconnected(() => {
      console.log('✅ SignalR reconnected successfully');
      this.connectionState.next('Connected');
    });
  }

  // Setup event listeners
  private setupEventListeners(): void {
    if (!this.hubConnection) return;

    // Handle new messages
    this.hubConnection.on('ReceiveMessage', (message: ChatMessage) => {
      console.log('📨 New message received via SignalR:', message);
      this.messageReceived.next(message);
    });

    // Handle message read receipts
    this.hubConnection.on('MessageRead', (data: {messageId: number, userId: number}) => {
      console.log('👁️ Message read via SignalR:', data);
      this.messageRead.next(data);
    });

    // Handle typing indicators
    this.hubConnection.on('UserTyping', (data: {bookingId: number, userId: number, isTyping: boolean}) => {
      console.log('⌨️ User typing via SignalR:', data);
      this.userTyping.next(data);
    });

    // Handle user online/offline status
    this.hubConnection.on('UserOnline', (data: {userId: number, isOnline: boolean}) => {
      console.log('🟢 User online via SignalR:', data);
      this.userOnline.next(data);
    });

    this.hubConnection.on('UserOffline', (data: {userId: number, isOnline: boolean}) => {
      console.log('🔴 User offline via SignalR:', data);
      this.userOnline.next(data);
    });

    // Handle additional events
    this.hubConnection.on('AllMessagesRead', (userId: number) => {
      console.log('📖 All messages read by user:', userId);
    });

    this.hubConnection.on('MessageDeleted', (messageId: number) => {
      console.log('🗑️ Message deleted:', messageId);
    });

    this.hubConnection.on('MessageEdited', (message: ChatMessage) => {
      console.log('✏️ Message edited:', message);
    });

    this.hubConnection.on('MessageReaction', (reaction) => {
      console.log('Received MessageReaction event:', reaction);
      this.messageReaction.next(reaction);
    });
  }

  // Join booking chat room
  public joinBookingChat(bookingId: number): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      return this.hubConnection.invoke('JoinBookingChat', bookingId);
    }
    return Promise.reject('SignalR connection not established');
  }

  // Leave booking chat room
  public leaveBookingChat(bookingId: number): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      return this.hubConnection.invoke('LeaveBookingChat', bookingId);
    }
    return Promise.reject('SignalR connection not established');
  }

  // Send typing indicator
  public sendTypingIndicator(bookingId: number, isTyping: boolean): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      return this.hubConnection.invoke('SendTypingIndicator', bookingId, isTyping);
    }
    return Promise.reject('SignalR connection not established');
  }

  // Join chat room (wrapper method)
  public async joinChatRoom(bookingId: number): Promise<void> {
    const connectionState = this.getConnectionState();
    console.log('🔗 SignalR connection state:', connectionState);

    if (connectionState === 'Connected') {
      try {
        await this.joinBookingChat(bookingId);
        console.log('✅ Joined SignalR chat room for booking:', bookingId);
      } catch (error) {
        console.warn('⚠️ Could not join SignalR chat room:', error);
        throw error;
      }
    } else {
      console.log('⚠️ SignalR not connected, cannot join chat room');
      throw new Error('SignalR not connected');
    }
  }

  // Observables for components to subscribe to
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

  get messageReaction$(): Observable<any> {
    return this.messageReaction.asObservable();
  }

  // Get connection status
  public getConnectionState(): string {
    if (!this.hubConnection) return 'Disconnected';
    return this.hubConnection.state;
  }

  // Stop SignalR connection
  public stopConnection(): Promise<void> {
    if (this.hubConnection) {
      return this.hubConnection.stop().then(() => {
        console.log('SignalR connection stopped');
        this.connectionState.next('Disconnected');
      });
    }
    return Promise.resolve();
  }
}
