export class Payments {
PaymentId!: number;
  BookingId!: number;
  amountPaid!: number;
  PaymentMethod!: string; // Stripe, etc.
  TransactionId?: string;
  PaymentDate?: Date;



}
