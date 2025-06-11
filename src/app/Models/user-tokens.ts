export class UserTokens {
TokenId!: number;
  UserId!: number;
  TokenType!: string; // 'EmailVerification', 'PasswordReset'
  TokenValue!: string;
  ExpiryDate?: Date;
  IsUsed!: boolean;
  CreatedAt?: Date;


}
