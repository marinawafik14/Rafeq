export interface ExternalLoginDto {
  provider: string;
  idToken: string;
  fullName: string;
  email: string;
  profilePicture?: string;
  role: 'Mentee' | 'Mentor';
}
