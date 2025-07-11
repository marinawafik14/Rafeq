export interface Users {
  id: number;           
  fullName: string;         
  email: string;         
  PasswordHash: string;     
   profilePicture?: string;  
  bio?: string;        
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
  
  hourlyRate?: number;       
}

export interface EditUser {
  fullName: string;
  email: string;
  profilePicture?: string;
  bio?: string;
  role: string;
  isMentor: boolean;
  isInterviewer: boolean;
  hourlyRate?: number;
}


 