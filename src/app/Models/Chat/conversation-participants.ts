import { ChatParticipant } from './chat-participant';

export interface ConversationParticipants {
  bookingId: number;
  sessionType: string;
  startDateTime: Date;
  endDateTime: Date;
  status: string;
  googleMeetLink?: string;
  totalAmount: number;
  mentor: ChatParticipant;
  mentee: ChatParticipant;
}
