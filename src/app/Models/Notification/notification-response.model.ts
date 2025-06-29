
import { NotificationDto } from './notification.model';

export interface NotificationResponse {
  success: boolean;
  data?: NotificationDto[];
  message?: string;
  count?: number;
  error?: string;
}

export interface MarkAsReadResponse {
  success: boolean;
  message: string;
  count: number;
}