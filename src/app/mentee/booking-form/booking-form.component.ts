import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { menteeBookingservice } from '../../Services/menteeBooking.service';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../Services/auth.service';

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
  availableDates: string[] = []; // Example, replace with API
  availableDays: string[] = []; // Available day names
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
            // Set available dates from availabilities
            this.availableDates = this.getAvailableDatesFromAvailabilities(mentor.availabilities);
            // Set available days (day names)
            this.availableDays = this.getAvailableDayNames(mentor.availabilities);
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
    console.log('Selected date:', date); // Debug log
    
    // Find slots for this date from mentor's availabilities
    this.availableSlots = this.getSlotsForDate(date);
    console.log('Available slots for', date, ':', this.availableSlots); // Debug log
    
    this.selectedSlot = null;
    this.nextStep();
  }

  getSlotsForDate(date: string): string[] {
    console.log('Getting slots for date:', date); // Debug log
    console.log('Mentor object:', this.mentor); // Debug log
    
    if (!this.mentor || !this.mentor.availabilities) {
      console.log('No mentor or availabilities found'); // Debug log
      return [];
    }
    
    let dayOfWeek: number;
    
    // Check if the date is a day name (like "Saturday") or a date string (like "2025-06-26")
    const dayNameToNumber: { [key: string]: number } = {
      'Sunday': 0,
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6
    };

    if (dayNameToNumber.hasOwnProperty(date)) {
      // It's a day name
      dayOfWeek = dayNameToNumber[date];
      console.log('Converting day name', date, 'to day number:', dayOfWeek);
    } else {
      // It's a date string, parse it
      const d = new Date(date);
      dayOfWeek = d.getDay();
      console.log('Parsing date string', date, 'to day number:', dayOfWeek);
    }

    console.log('Day of week for', date, ':', dayOfWeek); // Debug log
    console.log('All availabilities:', this.mentor.availabilities); // Debug log

    if (isNaN(dayOfWeek)) {
      console.log('Invalid date or day name:', date); // Debug log
      return [];
    }
    
    const slots: string[] = [];
    
    // Filter availabilities for the selected day
    const dayAvailabilities = this.mentor.availabilities.filter((a: any) => a.dayOfWeek === dayOfWeek);
    console.log('Filtered availabilities for day', dayOfWeek, ':', dayAvailabilities); // Debug log
    
    dayAvailabilities.forEach((availability: any) => {
      // Parse start and end times
      const startTime = availability.startTime; // "09:00:00"
      const endTime = availability.endTime;     // "12:00:00"
      
      console.log('Processing availability:', startTime, 'to', endTime); // Debug log
      
      const startHour = parseInt(startTime.split(':')[0], 10);
      const endHour = parseInt(endTime.split(':')[0], 10);
      
      // Generate hourly time slots (e.g., "9:00-10:00", "10:00-11:00")
      for (let hour = startHour; hour < endHour; hour++) {
        const nextHour = hour + 1;
        const timeSlot = `${hour}:00-${nextHour}:00`;
        
        // Avoid duplicates
        if (!slots.includes(timeSlot)) {
          slots.push(timeSlot);
          console.log('Added slot:', timeSlot); // Debug log
        }
      }
    });
    
    // Sort slots by start time
    const sortedSlots = slots.sort((a, b) => {
      const aStart = parseInt(a.split(':')[0]);
      const bStart = parseInt(b.split(':')[0]);
      return aStart - bStart;
    });
    
    console.log('Final sorted slots:', sortedSlots); // Debug log
    return sortedSlots;
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

    // Extract start and end time from selected slot (e.g., "9:00-10:00")
  const [startTime, endTime] = this.selectedSlot.split('-');

// For "9:00", split at ":"
const pad = (n: string) => n.length === 1 ? `0${n}` : n;

  //  Split and pad parts
  const [startHour, startMin] = startTime.split(':');
  const [endHour, endMin] = endTime.split(':');

  const startDateTime = `${this.selectedDate}T${pad(startHour)}:${startMin}:00`;
  const endDateTime = `${this.selectedDate}T${pad(endHour)}:${endMin}:00`;


    // Create booking session data object
    const bookingData = {
      menteeId: menteeId,
      mentorId: this.mentorId,
      mentorName: this.mentor.firstName + ' ' + this.mentor.lastName,
      sessionType: this.sessionType,
      selectedDate: this.selectedDate,
      selectedSlot: this.selectedSlot,
      startDateTime,
      endDateTime,
      price: this.calculatedPrice,
      mentorHourlyRate: this.mentor.hourlyRate || 0,
      termsAccepted: this.termsAccepted,
      timestamp: new Date().toISOString(),
      status: "Pending",
    paymentStatus: "Unpaid"
    };
  console.log('Will send:', {
    mentorId: this.mentorId,
    sessionType: this.sessionType,
    startDateTime,
    endDateTime
  });
// Call API to create booking
this.menteeBookingservice.createBookingForMentee(
  this.menteeId!,
  this.mentorId!,
  {
    sessionType: this.sessionType!,
    startDateTime,
    endDateTime,
    totalAmount: this.calculatedPrice // Pass total amount
  }
).subscribe({
  next: (response) => {
    const bookingId = response.bookingId;
    console.log('Booking created!', response);
    this.router.navigate(['/mentee', this.menteeId, 'payment'], {
      state: { bookingId }
    });
  },
  error: (err) => {
  if (err.status === 409 && err.error?.alternatives) {
    this.bookingError = `Time slot not available. Here are some alternatives: ${err.error.alternatives.join(', ')}`;
  } else {
    this.bookingError = 'Booking creation failed.';
  }
  console.error('Booking creation error:', err);
}

});

}
}
