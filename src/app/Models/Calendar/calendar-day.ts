import { AvailabilitySlot } from '../Availability/availability-slot';

export interface CalendarDay {
  dayOfWeek: number;
  dayName: string;
  date: Date;
  slots: AvailabilitySlot[];
  isToday: boolean;
}
