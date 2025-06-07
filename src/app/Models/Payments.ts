export class Payments {
PaymentId!: number;
  BookingId!: number;
  amountPaid!: number;
  paymentMethod!: string; // Stripe, etc.
  TransactionId?: string;
  paymentDate?: Date;
 menteeFullName?: string;
  mentorFullName?: string;


}
