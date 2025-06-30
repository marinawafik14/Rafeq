export interface Users {
  id: number;           
  fullName: string;         
  email: string;         
  PasswordHash: string;     
profilePicture?: string;  
  Bio?: string;        
  
  IsEmailVerified: boolean;   
  
  RoleId: number;     
  role: string;
  isActive: boolean;        
  createdAt: Date;          
  
  ExternalId?: string;       
  ExternalType?: string;     
  externalToken?: string;   
  
  isMentor: boolean;       
  isInterviewer: boolean;   
  
  IsDeleted: boolean;       
  
  HourlyRate?: number;       
}
