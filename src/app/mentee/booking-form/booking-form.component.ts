import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenteeLayoutComponent } from '../mentee-layout.component';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingService } from '../../Services/booking.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-booking-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MenteeLayoutComponent],
  templateUrl: './booking-form.component.html',
  styleUrls: ['./booking-form.component.css']
})
export class BookingFormComponent {
  step = 1;
  sessionType: 'mentorship' | 'interview' | null = null;
  selectedDate: string | null = null;
  availableDates: string[] = ['2025-06-05', '2025-06-06', '2025-06-07']; // Example, replace with API
  availableSlots: string[] = [];
  selectedSlot: string | null = null;
  price = 0;
  termsAccepted = false;
  paymentComplete = false;
  mentorId: number|null = null;
  mentor: any = null;
  showMentorship = false;
  showInterview = false;
  bookingError: string|null = null;

  constructor(
    private route: ActivatedRoute,
    private bookingService: BookingService,
    private router: Router,
    private http: HttpClient
  ) {
    this.route.queryParams.subscribe(params => {
      if (params['mentorId']) {
        this.mentorId = +params['mentorId'];
        // Fetch mentor details for session type and availability
        this.http.get(`/api/mentors/${this.mentorId}`).subscribe({
          next: (mentor: any) => {
            this.mentor = mentor;
            // Defensive: handle boolean values and string 'true'/'false'
            this.showMentorship = mentor.isMentor === true || mentor.isMentor === 'true';
            this.showInterview = mentor.isInterviewer === true || mentor.isInterviewer === 'true';
            // Set available dates from availabilities
            this.availableDates = this.getAvailableDatesFromAvailabilities(mentor.availabilities);
          },
          error: _ => {
            this.mentor = null;
            this.showMentorship = false;
            this.showInterview = false;
          }
        });
      }
    });
  }

  getAvailableDatesFromAvailabilities(availabilities: any[]): string[] {
    // Generate next 14 days, filter by mentor's available days
    const today = new Date();
    const result: string[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayOfWeek = d.getDay(); // 0=Sunday, 1=Monday, ...
      if (availabilities && availabilities.some(a => a.dayOfWeek === dayOfWeek)) {
        result.push(d.toISOString().slice(0, 10));
      }
    }
    return result;
  }

  // Example pricing logic
  get calculatedPrice() {
    return this.sessionType === 'interview' ? 100 : 60;
  }

  nextStep() {
    if (this.step < 4) this.step++;
  }
  prevStep() {
    if (this.step > 1) this.step--;
  }

  selectDate(date: string) {
    this.selectedDate = date;
    // Find slots for this date from mentor's availabilities
    this.availableSlots = this.getSlotsForDate(date);
    this.selectedSlot = null;
    this.nextStep();
  }

  getSlotsForDate(date: string): string[] {
    if (!this.mentor || !this.mentor.availabilities) return [];
    const d = new Date(date);
    const dayOfWeek = d.getDay();
    const slots: string[] = [];
    (this.mentor.availabilities as Array<any>).filter((a: any) => a.dayOfWeek === dayOfWeek).forEach((a: any) => {
      // Generate slots for each availability (hourly slots)
      const start = parseInt(a.startTime.split(':')[0], 10);
      const end = parseInt(a.endTime.split(':')[0], 10);
      for (let h = start; h < end; h++) {
        slots.push((h < 10 ? '0' : '') + h + ':00');
      }
    });
    return slots;
  }

  selectSessionType(type: 'mentorship' | 'interview') {
    this.sessionType = type;
    this.nextStep();
  }

  selectSlot(slot: string) {
    this.selectedSlot = slot;
    this.nextStep();
  }

  completePayment() {
    if (!this.mentorId || !this.sessionType || !this.selectedDate || !this.selectedSlot) {
      this.bookingError = 'Please complete all steps.';
      return;
    }
    // Construct start and end datetime (assume 1 hour slot for demo)
    const startDateTime = `${this.selectedDate}T${this.selectedSlot}:00`;
    const endDateTime = `${this.selectedDate}T${this.selectedSlot}:59`;
    const booking = {
      mentorId: this.mentorId,
      sessionType: this.sessionType,
      startDateTime,
      endDateTime
    };
    this.bookingService.createBooking(booking).subscribe({
      next: _ => {
        this.paymentComplete = true;
        this.nextStep();
      },
      error: err => {
        this.bookingError = 'Booking failed. Please try again.';
      }
    });
  }
}
