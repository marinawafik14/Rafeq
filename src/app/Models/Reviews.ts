export class Reviews {
ReviewId!: number;
  ReviewerId!: number;
  ReviewedUserId!: number;
  BookingId!: number;
  Rating?: number; // 1 to 5
  Comment?: string;
  CreatedAt?: Date;
  UpdatedAt?: Date;


}
