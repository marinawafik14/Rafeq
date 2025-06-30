export interface PaymentDetailsDto {
  success: boolean;
  data: {
    paymentId: number;
    bookingId: number;
    amountPaid: number;
    paymentMethod: string;
    transactionId: string;
    paymentDate: string;
    mentorName: string;
    menteeName: string;
    sessionType: string;
    sessionDateTime: string;
    commission: number;
    mentorAmount: number;
  };
}