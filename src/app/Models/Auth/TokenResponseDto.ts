export interface TokenResponseDto {
 accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  userId: number;
  fullName: string;
  email: string;
  role: string;
}
