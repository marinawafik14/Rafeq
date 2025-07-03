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
  selectedSlot: string | null = null;
  selectedFreeSlot: any = null;
  availableDates: string[] = []; // Example, replace with API
  availableDays: string[] = []; // Available day names
  availableSlots: string[] = [];
  price = 0;
  termsAccepted = false;
  paymentComplete = false;
  mentorId: number|null = null;
  menteeId: number|null = null;
  mentor: any = null;
  showMentorship = false;
  showInterview = false;
  bookingError: string|null = null;


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
    // Get menteeId from route parameters
    this.route.paramMap.subscribe(params => {
      const menteeId = params.get('menteeId');
      this.menteeId = menteeId ? +menteeId : null;
      
      // If no menteeId in route, try to get it from auth token
      if (!this.menteeId) {
        const token = document.cookie.split('; ').find(row => row.startsWith('authToken='))?.split('=')[1];
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            this.menteeId = payload.menteeId || payload.userId || null;
          } catch (e) {
            console.error('Failed to parse token:', e);
          }
        }
      }
    });

    this.route.queryParams.subscribe(params => {
      if (params['mentorId']) {
        this.mentorId = +params['mentorId'];
        console.log('Loading mentor information for ID:', this.mentorId); // Debug log
        // Fetch mentor details for session type and availability
        this.http.get(`https://localhost:7001/api/mentors/${this.mentorId}`).subscribe({
          next: (mentor: any) => {
            console.log('Mentor loaded successfully:', mentor); // Debug log
            this.mentor = mentor;
            // Defensive: handle boolean values and string 'true'/'false'
            this.showMentorship = mentor.isMentor === true || mentor.isMentor === 'true';
            this.showInterview = mentor.isInterviewer === true || mentor.isInterviewer === 'true';
            
            // Load free slots from the API instead of using availabilities
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

  getAvailableDayNames(availabilities: any[]): string[] {
    if (!availabilities || availabilities.length === 0) return [];
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const uniqueDays = [...new Set(availabilities.map(a => a.dayOfWeek))];
    return uniqueDays.map(dayOfWeek => dayNames[dayOfWeek]).filter(Boolean);
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
    console.log('Selected date:', date);
    
    // Find slots for this date from free slots
    this.availableSlots = this.getSlotsForDate(date);
    console.log('Available slots for', date, ':', this.availableSlots);
    
    this.selectedSlot = null;
    this.selectedFreeSlot = null;
    
    // Navigate to next step to show time slots
    this.nextStep();
  }

  getSlotsForDate(date: string): string[] {
    if (!date || !this.freeSlots?.length) return [];
    
    console.log('Getting slots for date:', date);
    console.log('Free slots:', this.freeSlots);
    
    const selectedDateSlots = this.freeSlots.filter(slot => {
      return new Date(slot.start).toISOString().slice(0, 10) === date;
    });
    
    console.log('Filtered slots for date:', selectedDateSlots);
    
    // Extract time range from formatted string (e.g., "10:00 AM - 1:00 PM")
    return selectedDateSlots
      .map(slot => {
        // Extract time part from formatted string
        const timePart = slot.formatted.split('•')[1]?.trim();
        return timePart || slot.formatted;
      })
      .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates
      .sort();
  }

  selectSessionType(type: 'mentorship' | 'interview') {
    this.sessionType = type;
    this.nextStep();
  }

  selectSlot(slot: string) {
    this.selectedSlot = slot;
    console.log('Selected slot:', slot);
    
    // Find the corresponding free slot object
    this.selectedFreeSlot = this.findSelectedFreeSlot();
    console.log('Selected free slot object:', this.selectedFreeSlot);
    
    this.nextStep();
  }

  private findSelectedFreeSlot(): any {
    if (!this.selectedDate || !this.selectedSlot) return null;
    
    return this.freeSlots.find(slot => {
      const slotDate = new Date(slot.start).toISOString().slice(0, 10);
      const timeRange = slot.formatted.split('•')[1]?.trim() || slot.formatted;
      return slotDate === this.selectedDate && timeRange === this.selectedSlot;
    });
  }

  // Free slots loading and management
  freeSlots: any[] = [];
  loadingSlots = false;

  private loadFreeSlots(): void {
    if (!this.mentorId) return;

    this.loadingSlots = true;
    this.http.get<any[]>(`https://localhost:7001/api/mentors/mentors/${this.mentorId}/free-slots`).subscribe({
      next: (slots) => {
        console.log('Free slots loaded:', slots);
        this.freeSlots = this.filterFutureSlots(slots);
        this.availableDates = this.getAvailableDatesFromFreeSlots();
        this.loadingSlots = false;
      },
      error: (err) => {
        console.error('Error loading free slots:', err);
        this.loadingSlots = false;
      }
    });
  }

  private filterFutureSlots(slots: any[]): any[] {
    const now = new Date();
    return slots.filter(slot => new Date(slot.start) > now);
  }

  private getAvailableDatesFromFreeSlots(): string[] {
    if (!this.freeSlots?.length) return [];
    
    const dates = new Set<string>();
    this.freeSlots.forEach(slot => {
      dates.add(new Date(slot.start).toISOString().slice(0, 10));
    });
    
    return Array.from(dates).sort();
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
    
    if (!this.mentorId || !this.sessionType || !this.selectedDate || !this.selectedSlot || !this.selectedFreeSlot) {
      this.bookingError = 'Please complete all steps and select a time slot.';
      return;
    }
    
    if (!this.mentor) {
      this.bookingError = 'Mentor info missing. Please try again.';
      return;
    }

    // Use the exact start and end times from the selected free slot
    const startDateTime = new Date(this.selectedFreeSlot.start).toISOString();
    const endDateTime = new Date(this.selectedFreeSlot.end).toISOString();

    console.log('=== BOOKING CREATION DEBUG ===');
    console.log('Selected free slot:', this.selectedFreeSlot);
    console.log('Start time (ISO):', startDateTime);
    console.log('End time (ISO):', endDateTime);
    console.log('this.calculatedPrice value:', this.calculatedPrice);
    console.log('typeof this.calculatedPrice:', typeof this.calculatedPrice);
    console.log('this.sessionType:', this.sessionType);
    
    // Create booking data object that includes totalAmount
    const bookingData = {
      mentorId: this.mentorId!,
      sessionType: this.sessionType!,
      startDateTime: startDateTime,
      endDateTime: endDateTime,
      totalAmount: this.calculatedPrice
    };

    console.log('Booking data object created:', bookingData);
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
        
        // Store the calculated amount in session storage for verification
        sessionStorage.setItem(`booking_${bookingId}_amount`, this.calculatedPrice.toString());
        
        // Navigate to payment with the booking ID
        this.router.navigate(['/mentee', 'payment'], {
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

  // Helper method for formatting dates
  getFormattedDate(dateString: string): string {
    const date = new Date(dateString);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return `${days[date.getDay()]} ${date.getDate()}`;
  }
}


