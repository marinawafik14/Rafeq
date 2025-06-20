import { ChatMessage } from './chat-message';

export interface ChatSearchResults {
  messages: ChatMessage[];
  totalCount: number;
  query: string;
}

export interface OnlineStatus {
  mentorId: number;
  mentorName: string;
  mentorIsOnline: boolean;
  menteeId: number;
  menteeName: string;
  menteeIsOnline: boolean;
}