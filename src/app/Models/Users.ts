export class Users {
  UserId!: number;           
  FullName!: string;         
  Email!: string;         
  PasswordHash!: string;     
  
  ProfilePicture?: string;  
  Bio?: string;        
  
  IsEmailVerified!: boolean;   
  
  RoleId!: number;     
  
  IsActive!: boolean;        
  CreatedAt!: Date;          
  
  ExternalId?: string;       
  ExternalType?: string;     
  externalToken?: string;   
  
  IsMentor!: boolean;       
  IsInterviewer!: boolean;   
  
  IsDeleted!: boolean;       
  
  HourlyRate?: number;       
}
