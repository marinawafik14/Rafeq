import { ChatAttachment } from './chat-attachment';
import { MessageReaction } from './message-reaction';

export interface ChatMessage {
  messageId: number;
  bookingId: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  profilePicture?: string;
  messageText: string;
  isRead: boolean;
  sentAt: Date;
  readByUserIds: number[];
  attachments: ChatAttachment[];
  isEdited?: boolean;
  editedAt?: Date;
  reactions?: MessageReaction[];
  isVoiceMessage?: boolean;
}
