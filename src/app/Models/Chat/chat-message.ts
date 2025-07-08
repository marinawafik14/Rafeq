import { ChatAttachment } from './chat-attachment';
import { MessageReaction } from './message-reaction';

// Update your ChatMessage interface
export interface ChatMessage {
  messageId: number;
  bookingId: number;
  conversationId?: number;
  senderId: number;
  senderName: string;
  senderProfilePicture?: string;
  profilePicture?: string; // Add this for system messages
  messageText: string;
  isRead: boolean;
  sentAt: Date;
  readByUserIds?: number[];
  attachments: ChatAttachment[];
  isEdited?: boolean;
  editedAt?: Date;
  reactions?: MessageReaction[];
  isVoiceMessage?: boolean;
  transcriptText?: string; 
}
