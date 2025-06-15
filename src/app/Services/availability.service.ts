import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../environments/environment.development';
import { AvailabilitySlot } from '../Models/Availability/availability-slot';
import { CreateAvailabilityRequest } from '../Models/Availability/create-availability-request';
import { UpdateAvailabilityRequest } from '../Models/Availability/update-availability-request';
import { WeeklySchedule } from '../Models/Availability/weekly-schedule';
import { ConflictValidation } from '../Models/Calendar/conflict-validation';

@Injectable({
  providedIn: 'root'
})
export class AvailabilityService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Get user availability
  getUserAvailability(userId: number): Observable<AvailabilitySlot[]> {
    return this.http.get<{success: boolean, data: AvailabilitySlot[]}>(`${this.apiUrl}/availability/${userId}`)
      .pipe(
        map(response => response.data)
      );
  }

  // Add availability slot
  addAvailabilitySlot(request: CreateAvailabilityRequest): Observable<AvailabilitySlot> {
    return this.http.post<{success: boolean, data: AvailabilitySlot}>(`${this.apiUrl}/availability`, request)
      .pipe(
        map(response => response.data)
      );
  }

  // Update availability slot
  updateAvailabilitySlot(id: number, request: UpdateAvailabilityRequest): Observable<AvailabilitySlot> {
    return this.http.put<{success: boolean, data: AvailabilitySlot}>(`${this.apiUrl}/availability/${id}`, request)
      .pipe(
        map(response => response.data)
      );
  }

  // Delete availability slot
  deleteAvailabilitySlot(id: number): Observable<any> {
    return this.http.delete<{success: boolean, message: string}>(`${this.apiUrl}/availability/${id}`);
  }

  // Helper methods for frontend logic
  validateTimeSlot(startTime: string, endTime: string, existingSlots: AvailabilitySlot[], dayOfWeek: number, excludeId?: number): ConflictValidation {
    const start = this.timeStringToMinutes(startTime);
    const end = this.timeStringToMinutes(endTime);

    // Check if end time is after start time
    if (end <= start) {
      return {
        hasConflict: true,
        conflictingSlots: [],
        message: 'End time must be after start time'
      };
    }

    // Check for overlaps with existing slots
    const conflictingSlots = existingSlots
      .filter(slot => slot.dayOfWeek === dayOfWeek && slot.availabilityId !== excludeId)
      .filter(slot => {
        const slotStart = this.timeStringToMinutes(slot.startTime);
        const slotEnd = this.timeStringToMinutes(slot.endTime);
        
        // Check if there's any overlap
        return (start < slotEnd && end > slotStart);
      });

    return {
      hasConflict: conflictingSlots.length > 0,
      conflictingSlots: conflictingSlots.map(slot => slot.availabilityId),
      message: conflictingSlots.length > 0 ? 'This time slot overlaps with existing availability' : ''
    };
  }

  // Convert time string to minutes for easier comparison
  public timeStringToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Convert minutes back to time string
  minutesToTimeString(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`;
  }

  // Generate time slots for calendar display
  generateTimeSlots(startHour: number = 9, endHour: number = 18, interval: number = 30): string[] {
    const slots: string[] = [];
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += interval) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  }

  // Organize availability by week
  organizeByWeek(availability: AvailabilitySlot[]): WeeklySchedule {
    const schedule: WeeklySchedule = {};
    
    // Initialize all days
    for (let i = 0; i < 7; i++) {
      schedule[i] = [];
    }

    // Group slots by day
    availability.forEach(slot => {
      if (!schedule[slot.dayOfWeek]) {
        schedule[slot.dayOfWeek] = [];
      }
      schedule[slot.dayOfWeek].push(slot);
    });

    // Sort slots by start time for each day
    Object.keys(schedule).forEach(day => {
      schedule[Number(day)].sort((a, b) => 
        this.timeStringToMinutes(a.startTime) - this.timeStringToMinutes(b.startTime)
      );
    });

    return schedule;
  }

  // Get day names
  getDayNames(): string[] {
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  }

  // Format time for display
  formatTimeForDisplay(timeString: string): string {
    const [hours, minutes] = timeString.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  }
}
