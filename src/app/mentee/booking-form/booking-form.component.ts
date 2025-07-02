import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { menteeBookingservice } from '../../Services/menteeBooking.service';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../Services/auth.service';
import { Bookings } from '../../Models/Bookings';


@Component({
  selector: 'app-booking-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking-form.component.html',
  styleUrls: ['./booking-form.component.css']
})
export class BookingFormComponent {
  
  step = 1;
  sessionType: 'mentorship' | 'interview' | null = null;
  selectedDate: string | null = null;
  availableDates: string[] = []; 
  availableDays: string[] = []; 
  availableSlots: string[] = [];
  selectedSlot: string | null = null;
  price = 0;
  termsAccepted = false;
  paymentComplete = false;
  mentorId: number|null = null;
  menteeId: number|null = null;
  mentor: any = null;
  showMentorship = false;
  showInterview = false;
  bookingError: string|null = null;
  freeSlots: any[] = [];
  loadingSlots = false;



   getUtcSlot(date: string, hour: number, min: number): string {
  // Egypt is UTC+2 (no DST in 2025)
  const d = new Date(`${date}T${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:00+02:00`);
  return d.toISOString().slice(0, 19) + 'Z';
}

  
  constructor(
    private route: ActivatedRoute,
    private menteeBookingservice: menteeBookingservice,
    private router: Router,
    private http: HttpClient,
    private authService: AuthService
  ) {
    // Get menteeId from AuthService (currentUserValue)
    const user = this.authService.currentUserValue;
    this.menteeId = user && user.userId ? user.userId : null;
    
    // If no menteeId found, log an error
    if (!this.menteeId) {
      console.error('No valid menteeId found. Please log in again.');
    }

    this.route.queryParams.subscribe(params => {
      if (params['mentorId']) {
        this.mentorId = +params['mentorId'];
        console.log('Loading mentor information for ID:', this.mentorId); // Debug log
        // Fetch mentor details for session type
        this.http.get(`https://localhost:7001/api/mentors/${this.mentorId}`).subscribe({
          next: (mentor: any) => {
            console.log('Mentor loaded successfully:', mentor); // Debug log
            this.mentor = mentor;
            // Defensive: handle boolean values and string 'true'/'false'
            this.showMentorship = mentor.isMentor === true || mentor.isMentor === 'true';
            this.showInterview = mentor.isInterviewer === true || mentor.isInterviewer === 'true';
            
            // Load free slots instead of using old availability
            this.loadFreeSlots();
          },
          error: (error) => {
            console.error('Failed to load mentor:', error); // Debug log
            this.mentor = null;
            this.showMentorship = false;
            this.showInterview = false;
          }
        });
      } else {
        console.warn('No mentorId found in query parameters'); // Debug log
      }
    });
  }

  private loadFreeSlots() {
    if (!this.mentorId) return;

    this.loadingSlots = true;
    this.http.get<any[]>(`https://localhost:7001/api/mentors/mentors/${this.mentorId}/free-slots`).subscribe({
      next: (slots) => {
        // Filter out past slots
        const now = new Date();
        this.freeSlots = slots.filter(slot => {
          const slotStart = new Date(slot.start);
          return slotStart > now;
        });
        console.log('Free slots loaded:', this.freeSlots);
        
        // Extract available dates from free slots
        this.availableDates = this.getAvailableDatesFromFreeSlots();
        
        this.loadingSlots = false;
      },
      error: (err) => {
        console.error('Error loading free slots:', err);
        this.freeSlots = [];
        this.availableDates = [];
        this.loadingSlots = false;
      }
    });
  }

  private getAvailableDatesFromFreeSlots(): string[] {
    if (!this.freeSlots || this.freeSlots.length === 0) return [];
    
    const dates = new Set<string>();
    this.freeSlots.forEach(slot => {
      const slotDate = new Date(slot.start);
      const dateString = slotDate.toISOString().slice(0, 10);
      dates.add(dateString);
    });
    
    return Array.from(dates).sort();
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
    console.log('Selected date:', date); // Debug log
    
    // Find slots for this date from mentor's availabilities
    this.availableSlots = this.getSlotsForDate(date);
    console.log('Available slots for', date, ':', this.availableSlots); // Debug log
    
    this.selectedSlot = null;
    // Don't automatically advance to next step - let user select a time slot first
  }

  getSlotsForDate(date: string): string[] {
    if (!this.freeSlots || this.freeSlots.length === 0) {
      return [];
    }
    
    // Filter slots for the selected date
    const selectedDateSlots = this.freeSlots.filter(slot => {
      const slotDate = new Date(slot.start);
      const slotDateString = slotDate.toISOString().slice(0, 10);
      return slotDateString === date;
    });
    
    // Use the formatted property from the API response
    const timeSlots = selectedDateSlots.map(slot => {
      // Extract just the time part from the formatted string (e.g., "9:00 AM - 12:00 PM")
      const timeRange = slot.formatted.split('•')[1]?.trim() || slot.formatted;
      return timeRange;
    });
    
    // Remove duplicates by converting to Set and back to array
    const uniqueTimeSlots = [...new Set(timeSlots)];
    
    console.log('Unique time slots:', uniqueTimeSlots); // Debug log
    return uniqueTimeSlots;
  }

  // Helper method to check if slots exist for a date
  hasSlots(date: string): boolean {
    return this.getSlotsForDate(date).length > 0;
  }

  selectSessionType(type: 'mentorship' | 'interview') {
    this.sessionType = type;
    this.nextStep();
  }

  selectSlot(slot: string) {
    this.selectedSlot = slot;
    // Don't automatically advance to next step
  }

  completePayment() {
    // Check authentication
    const user = this.authService.currentUserValue;
    const menteeId = user && user.userId ? user.userId : this.menteeId;
    if (!menteeId) {
      this.bookingError = 'You must be logged in to book a session.';
      this.router.navigate(['/login']);
      return;
    }
    
    if (!this.sessionType) {
      this.bookingError = 'Session type is required.';
      console.error('Session type is missing!');
      return;
    }
    
    if (!this.mentorId || !this.sessionType || !this.selectedDate || !this.selectedSlot) {
      this.bookingError = 'Please complete all steps.';
      return;
    }
    
    if (!this.mentor) {
      this.bookingError = 'Mentor info missing. Please try again.';
      return;
    }

    // Find the corresponding free slot to get the exact start and end times
    const selectedFreeSlot = this.freeSlots.find(slot => {
      const slotDate = new Date(slot.start).toISOString().slice(0, 10);
      // Extract the time part from the formatted string - handle potential undefined with optional chaining
      const timeRange = slot.formatted.split('•')[1]?.trim() || slot.formatted;
      
      return slotDate === this.selectedDate && timeRange === this.selectedSlot;
    });

    if (!selectedFreeSlot) {
      this.bookingError = 'Selected time slot not found. Please try again.';
      return;
    }

    // Use the exact start and end times from the free slot
    const startDateTime = selectedFreeSlot.start;
    const endDateTime = selectedFreeSlot.end;
    
    // Create booking data object that includes totalAmount
    const bookingData = {
      mentorId: this.mentorId!,
      sessionType: this.sessionType!,
      startDateTime: startDateTime,
      endDateTime: endDateTime,
      totalAmount: this.calculatedPrice
    };

    this.menteeBookingservice.createBookingForMentee(menteeId, bookingData).subscribe({
      next: (response) => {
        const bookingId = response.bookingId;
        
        if (!bookingId) {

    const [startTime, endTime] = this.selectedSlot.split('-');
    const [startHour, startMin] = startTime.split(':');
    const [endHour, endMin] = endTime.split(':');

    const convertToUtc = (date: string, hour: string, minute: string): string => {
      const [y, m, d] = date.split('-').map(Number);
      const h = Number(hour);
      const min = Number(minute);
      const localDate = new Date(y, m - 1, d, h, min);
      return new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000).toISOString();
    };

    const startDateTime = convertToUtc(this.selectedDate!, startHour, startMin);
    const endDateTime = convertToUtc(this.selectedDate!, endHour, endMin);

    console.log('=== BOOKING CREATION DEBUG ===');
    console.log('this.calculatedPrice value:', this.calculatedPrice);
    console.log('typeof this.calculatedPrice:', typeof this.calculatedPrice);
    console.log('this.sessionType:', this.sessionType);
    
    // Create booking data object that includes totalAmount
    const bookingData = {
      mentorId: this.mentorId!,
      sessionType: this.sessionType!,
      startDateTime: startDateTime,
      endDateTime: endDateTime,
      totalAmount: this.calculatedPrice // VERIFY THIS IS NOT UNDEFINED
    };

    console.log('Booking data object created:', bookingData);
    console.log('bookingData.totalAmount after creation:', bookingData.totalAmount);
    console.log('Is bookingData.totalAmount undefined?:', bookingData.totalAmount === undefined);
    console.log('JSON.stringify(bookingData):', JSON.stringify(bookingData));
    console.log('==============================');

    this.menteeBookingservice.createBookingForMentee(menteeId, bookingData).subscribe({
      next: (response) => {
        console.log('=== BOOKING CREATION RESPONSE ===');
        console.log('Full API response:', response);
        console.log('Response type:', typeof response);
        console.log('Response keys:', Object.keys(response));
        
        const bookingId = response.bookingId;
        console.log('Extracted bookingId:', bookingId);
        console.log('BookingId type:', typeof bookingId);
        console.log('===============================');
        
        if (!bookingId) {
          console.error('No booking ID found in response:', response);
          this.bookingError = 'Booking created but missing ID. Please contact support.';
          return;
        }
        
        // Navigate to payment with the booking ID

      --------- // this.router.navigate(['/mentee/payment'], {

        this.router.navigate(['/mentee', menteeId, 'payment'], {
          state: { 
            bookingId: bookingId,
            amount: this.calculatedPrice
          },
          queryParams: { 
            bookingId: bookingId,
            amount: this.calculatedPrice
          }
        });
      },
      error: (err) => {
        console.error('=== BOOKING CREATION ERROR ===');
        console.error('Full error:', err);
        console.error('Error status:', err.status);
        console.error('Error message:', err.error?.message || err.message);
        console.error('============================');
        this.bookingError = 'Booking creation failed: ' + (err.error?.message || err.message);
      }
    });
  }
}
