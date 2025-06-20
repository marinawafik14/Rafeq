export interface ChatConversation {
  conversationId: number;
  bookingId: number;
  mentorId: number;
  mentorName: string;
  mentorProfilePicture?: string;
  menteeId: number;
  menteeName: string;
  menteeProfilePicture?: string;
  lastMessageAt: Date;
  isActive: boolean;
  createdAt: Date;
  lastMessage?: {
    messageId: number;
    messageText: string;
    senderId: number;
    sentAt: Date;
    isRead: boolean;
  };
  unreadCount: number;
  sessionType?: string;
  sessionStatus?: string;
  startDateTime?: Date; // Add this line
  endDateTime?: Date;   // Optional: add this too
}
