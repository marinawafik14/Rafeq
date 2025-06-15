import { AvailabilitySlot } from './availability-slot';

export interface WeeklySchedule {
  [dayOfWeek: number]: AvailabilitySlot[];
}
