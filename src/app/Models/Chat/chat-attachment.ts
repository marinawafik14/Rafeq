export interface ChatAttachment {
  attachmentId: number;
  messageId: number;
  filePath: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  fullUrl: string;
  isVoiceMessage?: boolean;
}
