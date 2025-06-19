export interface CreateAvailabilityRequest {
  userId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}
