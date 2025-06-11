export class Availability {
AvailabilityId!: number;
  UserId!: number;
  DayOfWeek?: number; // 0 = Sunday, 6 = Saturday
  StartTime?: string; // Use string for time 'HH:mm:ss'
  EndTime?: string;



}
