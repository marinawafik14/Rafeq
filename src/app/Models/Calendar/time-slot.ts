export interface TimeSlot {
  hour: number;
  minute: number;
  timeString: string; // "HH:MM"
  isAvailable: boolean;
  availabilityId?: number;
}
