export interface FileAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  content?: string; 
  base64Data?: string; 
  uploadedAt: Date;
}
