export interface BookingFilter {
  status?: string;
  sessionType?: string;
  menteeName?: string;
  dateFrom?: Date;
  dateTo?: Date;
  paymentStatus?: string;
  sortBy?: 'date' | 'mentee' | 'status' | 'amount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}
