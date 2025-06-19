export interface CVDetails {
  cvId: number;
  userId: number;
  fileName: string;
  uploadDate: Date;
  isActive: boolean;
  userFullName: string;  
  downloadUrl: string;
  fileSize?: number;     
}