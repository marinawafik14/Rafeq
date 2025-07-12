import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { menteeBookingservice } from '../../Services/menteeBooking.service';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../Services/auth.service';
import { MenteeLayoutComponent } from '../mentee-layout.component';
import { environment } from '../../environments/environment.development';


@Component({
  selector: 'app-booking-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MenteeLayoutComponent],
  templateUrl: './booking-form.component.html',
  styleUrls: ['./booking-form.component.css']
})
export class BookingFormComponent implements OnDestroy {
  
  step = 1;
  sessionType: 'mentorship' | 'interview' | null = null;
  selectedDate: string | null = null;
  selectedSlot: string | null = null;
  selectedFreeSlot: any = null;
  availableDates: string[] = [];
  availableSlots: string[] = [];
  mentorId: number|null = null;
  menteeId: number|null = null;
  mentor: any = null;
  showMentorship = false;
  showInterview = false;
  bookingError: string|null = null;
  private cleanupTimeoutId: any = null;

  itemsPerPage: number = 7; 
  currentPage: number = 1;
  totalPages: number = 1;
  paginatedDates: string[] = [];

  loadingPayment: boolean = false;

   getUtcSlot(date: string, hour: number, min: number): string {
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
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    this.checkExistingPendingBooking();
    
    this.route.paramMap.subscribe(params => {
      const menteeId = params.get('menteeId');
      this.menteeId = menteeId ? +menteeId : null;
      
      if (!this.menteeId) {
        const token = document.cookie.split('; ').find(row => row.startsWith('authToken='))?.split('=')[1];
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            this.menteeId = payload.menteeId || payload.userId || null;
          } catch (e) {
          }
        }
      }
    });

    this.route.queryParams.subscribe(params => {
      if (params['mentorId']) {
        this.mentorId = +params['mentorId'];
        this.http.get(`${environment.apiUrl}/mentors/${this.mentorId}`).subscribe({
          next: (mentor: any) => {
            this.mentor = mentor;
            this.showMentorship = mentor.isMentor === true || mentor.isMentor === 'true';
            this.showInterview = mentor.isInterviewer === true || mentor.isInterviewer === 'true';
            this.loadFreeSlots();
          },
          error: (error) => {
            this.mentor = null;
            this.showMentorship = false;
            this.showInterview = false;
          }
        });
      }
    });
  }

  get calculatedPrice() {
    if (!this.mentor?.hourlyRate) {
      return this.sessionType === 'interview' ? 100 : 60; // Fallback prices
    }

    const sessionDuration = this.getSessionDuration();
    return Math.round(this.mentor.hourlyRate * sessionDuration);
  }

  private getSessionDuration(): number {
    if (!this.selectedFreeSlot) {
      return 1; 
    }

    const startTime = new Date(this.selectedFreeSlot.start);
    const endTime = new Date(this.selectedFreeSlot.end);
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    
    return Math.max(0.5, Math.round(durationHours * 2) / 2); 
  }

  get sessionDurationDisplay(): string {
    const duration = this.getSessionDuration();
    if (duration === 1) {
      return '1 hour';
    } else if (duration < 1) {
      return `${Math.round(duration * 60)} minutes`;
    } else {
      return `${duration} hours`;
    }
  }

  nextStep() {
    if (this.hasPendingBooking && this.step > 1) {
      this.bookingError = 'You cannot proceed while you have a pending booking. Please complete or cancel your pending booking first.';
      return;
    }
    
    if (this.step < 4) this.step++;
  }
  
  prevStep() {
    if (this.step > 1) {
      this.step--;
    }
  }

  selectDate(date: string) {
    if (this.hasPendingBooking) {
      this.bookingError = 'You cannot select a new date while you have a pending booking. Please complete or cancel your pending booking first.';
      return;
    }
    
    this.selectedDate = date;
    
    const hasSlots = this.availableDates.includes(date);
    
    if (!hasSlots) {
      this.bookingError = `No available slots for ${date}. Please select a different date.`;
      return;
    }
    
    this.bookingError = null;
    this.availableSlots = this.getSlotsForDate(date);
    this.selectedSlot = null;
    this.selectedFreeSlot = null;
    
    if (this.availableSlots.length === 0) {
      this.bookingError = `No time slots available for ${date}. Please select a different date.`;
    }
  }

  getSlotsForDate(date: string): string[] {
    if (!date || !this.freeSlots?.length) return [];
    // Only filter by date, as in mentor-profile-view
    const selectedDateSlots = this.freeSlots.filter(slot => {
      const slotDate = new Date(slot.start).toISOString().slice(0, 10);
      return slotDate === date;
    });
    return selectedDateSlots
      .map(slot => {
        const timePart = slot.formatted.split('•')[1]?.trim();
        return timePart || slot.formatted;
      })
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
  }

  selectSessionType(type: 'mentorship' | 'interview') {
    if (this.hasPendingBooking) {
      this.bookingError = 'You cannot book a new session while you have a pending booking. Please complete or cancel your pending booking first.';
      return;
    }
    
    this.sessionType = type;
    this.nextStep();
  }

  selectSlot(slot: string) {
    if (this.hasPendingBooking) {
      this.bookingError = 'You cannot select a time slot while you have a pending booking. Please complete or cancel your pending booking first.';
      return;
    }
    
    this.selectedSlot = slot;
    this.selectedFreeSlot = this.findSelectedFreeSlot();
    this.nextStep();
  }

  private findSelectedFreeSlot(): any {
    if (!this.selectedDate || !this.selectedSlot) return null;
    
    const foundSlot = this.freeSlots.find(slot => {
      const slotDate = new Date(slot.start).toISOString().slice(0, 10);
      const timeRange = slot.formatted.split('•')[1]?.trim() || slot.formatted;
      
      return slotDate === this.selectedDate && timeRange === this.selectedSlot;
    });

    if (foundSlot) {
      const startTime = new Date(foundSlot.start);
      const endTime = new Date(foundSlot.end);
      
      if (endTime <= startTime) {
        const reparsedTimes = this.parseTimeRange(this.selectedSlot, this.selectedDate);
        
        if (reparsedTimes && reparsedTimes.end > reparsedTimes.start) {
          return {
            ...foundSlot,
            start: reparsedTimes.start.toISOString(),
            end: reparsedTimes.end.toISOString(),
            corrected: true,
            originalStart: foundSlot.start,
            originalEnd: foundSlot.end
          };
        } else {
          return foundSlot;
        }
      }
    }
    return foundSlot;
  }

  freeSlots: any[] = [];
  loadingSlots = false;
  private slotsLoaded = false;

   initializePagination(): void {
    this.totalPages = Math.ceil(this.availableDates.length / this.itemsPerPage);
    this.updatePaginatedDates();
  }

  updatePaginatedDates(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedDates = this.availableDates.slice(startIndex, endIndex);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedDates();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedDates();
    }
  }

   private loadFreeSlots(forceRefresh: boolean = false): void {
    if (!this.mentorId) return;
    
    if (this.slotsLoaded && !forceRefresh) {
      return;
    }

    this.loadingSlots = true;
    this.http.get<any[]>(`${environment.apiUrl}/mentors/mentors/${this.mentorId}/free-slots`).subscribe({
      next: (slots) => {
        let myPendingBookingId: number | null = null;
        const pendingBooking = sessionStorage.getItem('pendingBooking');
        if (pendingBooking) {
          try {
            const booking = JSON.parse(pendingBooking);
            myPendingBookingId = booking.bookingId;
          } catch {}
        }

        const availableSlots = slots.filter(slot => {
          if (slot.status === 'pending_payment') {
            return myPendingBookingId && slot.bookingId === myPendingBookingId;
          }
          const startTime = new Date(slot.start);
          const endTime = new Date(slot.end);
          const timeRange = slot.formatted.split('•')[1]?.trim() || slot.formatted;
          if (endTime <= startTime && this.isCrossMidnightTimeRange(timeRange)) {
            return false;
          }
          return true;
        });

        this.freeSlots = this.filterFutureSlots(availableSlots);
        this.availableDates = this.getAvailableDatesFromFreeSlots();
        this.initializePagination();
        this.slotsLoaded = true;
        this.loadingSlots = false;
      },
      error: (err) => {
        this.loadingSlots = false;
      }
    });
  }

  private filterFutureSlots(slots: any[]): any[] {
    const now = new Date();
    
    const futureSlots = slots.filter(slot => {
      const slotStart = new Date(slot.start);
      const isFuture = slotStart > now;
      return isFuture;
    });
    
    return futureSlots;
  }

  private getAvailableDatesFromFreeSlots(): string[] {
    if (!this.freeSlots?.length) return [];
    const now = new Date();
    const dateMap = new Map<string, boolean>();
    this.freeSlots.forEach(slot => {
      const slotDate = new Date(slot.start).toISOString().slice(0, 10);
      const slotStart = new Date(slot.start);
      if (slotStart > now) {
        dateMap.set(slotDate, true);
      } else if (!dateMap.has(slotDate)) {
        dateMap.set(slotDate, false);
      }
    });
    const sortedDates = Array.from(dateMap.entries())
      .filter(([date, hasFuture]) => hasFuture)
      .map(([date]) => date)
      .sort();
    return sortedDates;
  }

  completePayment() {
    if (this.hasPendingBooking) {
      this.bookingError = 'You cannot create a new booking while you have a pending booking. Please complete or cancel your pending booking first.';
      return;
    }
    this.loadingPayment = true;

    const user = this.authService.currentUserValue;
    const menteeId = user && user.userId ? user.userId : this.menteeId;
    if (!menteeId) {
      this.bookingError = 'You must be logged in to book a session.';
      this.router.navigate(['/login']);
      return;
    }
    
    if (!this.sessionType) {
      this.bookingError = 'Session type is required.';
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

      const latestSlots = this.freeSlots;
      const slotsForTargetDate = latestSlots.filter(s => {
      const slotDate = new Date(s.start).toISOString().slice(0, 10);
      return slotDate === this.selectedDate;
    });
    
    slotsForTargetDate.forEach((slot, index) => {
      const timeRange = slot.formatted.split('•')[1]?.trim() || slot.formatted;
      const startTime = new Date(slot.start);
      const endTime = new Date(slot.end);
      const isBackendTimeValid = endTime > startTime;
      const isCrossMidnightFromFormat = this.isCrossMidnightTimeRange(timeRange);
    });
    
      const isSlotStillAvailable = latestSlots.some(slot => {
      const slotDate = new Date(slot.start).toISOString().slice(0, 10);
      const timeRange = slot.formatted.split('•')[1]?.trim() || slot.formatted;
      
      const dateMatches = slotDate === this.selectedDate;
      const timeMatches = timeRange === this.selectedSlot;
      
      if (dateMatches && timeMatches) {
        const startTime = new Date(slot.start);
        const endTime = new Date(slot.end);
        const isBackendTimeValid = endTime > startTime;
        const isCrossMidnightFromFormat = this.isCrossMidnightTimeRange(timeRange);
        
        if (!isBackendTimeValid && isCrossMidnightFromFormat) {
          return false; 
        }
        
        const isNotBooked = !slot.status || slot.status !== 'booked';
        
        return isNotBooked;
      }
      
      return false;
    });
    
    if (!isSlotStillAvailable) {
      this.bookingError = `The selected time slot "${this.selectedSlot}" is no longer available. Please select a different time slot.`;
      this.selectedSlot = null;
      this.selectedFreeSlot = null;
      this.step = 2; 
      return;
    }
    
    this.proceedWithBooking(menteeId);
  }

  private proceedWithBooking(menteeId: number): void {
    let startDateTime: string;
    let endDateTime: string;
    let startTime: Date;
    let endTime: Date;

    const backendStartTime = new Date(this.selectedFreeSlot.start);
    const backendEndTime = new Date(this.selectedFreeSlot.end);
    
    const timeRange = this.selectedSlot;
    const isCrossMidnightSlot = timeRange && this.isCrossMidnightTimeRange(timeRange);
    
    if (this.selectedFreeSlot.corrected && this.selectedFreeSlot.originalStart && this.selectedFreeSlot.originalEnd) {
      startTime = new Date(this.selectedFreeSlot.originalStart);
      endTime = new Date(this.selectedFreeSlot.originalEnd);
      
      if (isCrossMidnightSlot && endTime <= startTime) {
        endTime = new Date(endTime.getTime() + (24 * 60 * 60 * 1000));
      }
      
      startDateTime = startTime.toISOString();
      endDateTime = endTime.toISOString();
    } else if (isCrossMidnightSlot && this.selectedSlot && this.selectedDate) {
      
      const parsedTimes = this.parseTimeRange(this.selectedSlot, this.selectedDate);
      
      if (parsedTimes && parsedTimes.end > parsedTimes.start) {
        startTime = parsedTimes.start;
        endTime = parsedTimes.end;
        startDateTime = startTime.toISOString();
        endDateTime = endTime.toISOString();
      } else {
        this.bookingError = `Unable to parse cross-midnight time slot: "${this.selectedSlot}". Please try a different slot.`;
        return;
      }
    } else {
      startTime = backendStartTime;
      endTime = backendEndTime;
      startDateTime = startTime.toISOString();
      endDateTime = endTime.toISOString();
    }
    
    if (!isCrossMidnightSlot && endTime <= startTime) {
      this.bookingError = `Invalid time slot: End time must be after start time. Please select a different slot.`;
      return;
    }
    
    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    if (isCrossMidnightSlot && (durationHours <= 0 || durationHours > 24)) {
      this.bookingError = `Invalid cross-midnight time slot duration. Please select a different slot.`;
      return;
    }

    const bookingData = {
      mentorId: this.mentorId!,
      sessionType: this.sessionType!,
      startDateTime: startDateTime,
      endDateTime: endDateTime,
      totalAmount: this.calculatedPrice,
      status: 'pending_payment' 
    };

    this.loadingSlots = true;
    this.bookingError = null;

    this.menteeBookingservice.createBookingForMentee(menteeId, bookingData).subscribe({
      next: (response) => {
        sessionStorage.removeItem('pendingBooking');
        
        const bookingId = response.bookingId;
        if (!bookingId) {
          this.bookingError = 'Booking created but missing ID. Please contact support.';
          return;
        }
        
        sessionStorage.setItem(`booking_${bookingId}_amount`, this.calculatedPrice.toString());
        
        const pendingBooking = {
          bookingId: bookingId,
          timestamp: new Date().getTime(),
          amount: this.calculatedPrice
        };
        sessionStorage.setItem('pendingBooking', JSON.stringify(pendingBooking));
        
        this.setupBookingCleanupTimeout(bookingId);
        
        this.router.navigate(['/mentee', 'payment'], {
          queryParams: { 
            bookingId: bookingId,
            amount: this.calculatedPrice
          }
        });
        this.loadingPayment = false;
        this.loadingSlots = false;
      },
      error: (error) => {
        this.loadingPayment = false;
        this.loadingSlots = false;
        
        if (error.status === 409) {
          this.bookingError = `The selected time slot "${this.selectedSlot}" is no longer available. It was just booked by another user. Please select a different time slot.`;
          this.refreshSlotsAfterConflict();
          this.selectedSlot = null;
          this.selectedFreeSlot = null;
          this.step = 2; 
        } else if (error.status === 400 && error.error && error.error.message) {
          this.bookingError = error.error.message;
        } else if (error.status === 401 || error.status === 403) {

          this.bookingError = 'Authentication failed. Please log in again.';
          this.router.navigate(['/login']);
        } else {
          this.bookingError = 'Failed to create booking. Please try again.';
        }
      }
    });
  }

  private setupBookingCleanupTimeout(bookingId: number): void {
    if (this.cleanupTimeoutId) {
      clearTimeout(this.cleanupTimeoutId);
    }
    
    this.cleanupTimeoutId = setTimeout(() => {
      const pendingBooking = sessionStorage.getItem('pendingBooking');
      if (pendingBooking) {
        const booking = JSON.parse(pendingBooking);
        if (booking.bookingId === bookingId) {
          this.cleanupUnpaidBooking(bookingId);
        }
      }
    }, 5 * 60 * 1000);
  }

  private cleanupUnpaidBooking(bookingId: number): void {
    this.http.delete(`${environment.apiUrl}/MenteeBookings/${bookingId}`).subscribe({
      next: (response: any) => {
        sessionStorage.removeItem('pendingBooking');
        sessionStorage.removeItem(`booking_${bookingId}_amount`);
        
        if (this.cleanupTimeoutId) {
          clearTimeout(this.cleanupTimeoutId);
          this.cleanupTimeoutId = null;
        }
        
        this.loadFreeSlots(true);
      },
      error: (err: any) => {
        sessionStorage.removeItem('pendingBooking');
        sessionStorage.removeItem(`booking_${bookingId}_amount`);
      }
    });
  }

  private checkExistingPendingBooking(): void {
    const pendingBooking = sessionStorage.getItem('pendingBooking');
    if (pendingBooking) {
      const booking = JSON.parse(pendingBooking);
      const now = new Date().getTime();
      const timeDiff = now - booking.timestamp;
      const timeoutDuration = 5 * 60 * 1000;
      
      if (timeDiff > timeoutDuration) {
        this.cleanupUnpaidBooking(booking.bookingId);
      } else {
        const remainingTime = timeoutDuration - timeDiff;
        const remainingMinutes = Math.ceil(remainingTime / (60 * 1000));
        
        this.bookingError = `You have a pending booking (ID: ${booking.bookingId}) that will be automatically cancelled in ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}. Please complete the payment, wait for it to expire, or cancel it to create a new booking.`;
        
        this.setupCountdownTimer(booking.bookingId, remainingTime);
      }
    }
  }

  private setupCountdownTimer(bookingId: number, remainingTime: number): void {
    const updateInterval = setInterval(() => {
      const pendingBooking = sessionStorage.getItem('pendingBooking');
      if (!pendingBooking) {
        clearInterval(updateInterval);
        return;
      }
      
      const booking = JSON.parse(pendingBooking);
      if (booking.bookingId !== bookingId) {
        clearInterval(updateInterval);
        return;
      }
      
      const now = new Date().getTime();
      const timeDiff = now - booking.timestamp;
      const timeoutDuration = 5 * 60 * 1000;
      const newRemainingTime = timeoutDuration - timeDiff;
      
      if (newRemainingTime <= 0) {
        clearInterval(updateInterval);
        this.cleanupUnpaidBooking(bookingId);
        this.bookingError = 'Your pending booking has expired and been cancelled. You can create a new booking.';
        
        this.step = 1;
        this.sessionType = null;
        this.selectedDate = null;
        this.selectedSlot = null;
        this.selectedFreeSlot = null;
      } else {
        const remainingMinutes = Math.ceil(newRemainingTime / (60 * 1000));
        this.bookingError = `You have a pending booking (ID: ${bookingId}) that will be automatically cancelled in ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}. Please complete the payment or cancel it to create a new booking.`;
      }
    }, 60000);
  }

  getFormattedDate(dateString: string): string {
    const date = new Date(dateString);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return `${days[date.getDay()]} ${date.getDate()}`;
  }

  private parseTimeRange(timeRange: string, baseDate: string): { start: Date, end: Date } | null {
    try {
      const [startStr, endStr] = timeRange.split(' - ');
      if (!startStr || !endStr) return null;

      const parseTime = (timeStr: string, date: string): Date => {
        const [time, period] = timeStr.trim().split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        
        let hour24 = hours;
        if (period?.toUpperCase() === 'PM' && hours !== 12) {
          hour24 += 12;
        } else if (period?.toUpperCase() === 'AM' && hours === 12) {
          hour24 = 0;
        }
        
        const dateTime = new Date(date);
        dateTime.setHours(hour24, minutes, 0, 0);
        return dateTime;
      };

      const startTime = parseTime(startStr, baseDate);
      let endTime = parseTime(endStr, baseDate);
      
      const startPeriod = startStr.trim().split(' ')[1]?.toUpperCase();
      const endPeriod = endStr.trim().split(' ')[1]?.toUpperCase();
      
      if (startPeriod === 'PM' && endPeriod === 'AM') {
        endTime = new Date(endTime.getTime() + (24 * 60 * 60 * 1000));
      } else if (endTime <= startTime) {
        endTime = new Date(endTime.getTime() + (24 * 60 * 60 * 1000));
      }
      
      return { start: startTime, end: endTime };
    } catch (error) {
      return null;
    }
  }

  hasSlots(date: string): boolean {
    const slots = this.getSlotsForDate(date);
    return slots.length > 0;
  }

  cancelPendingBooking(): void {
    const pendingBooking = sessionStorage.getItem('pendingBooking');
    if (pendingBooking) {
      const booking = JSON.parse(pendingBooking);
      this.cleanupUnpaidBooking(booking.bookingId);
      this.bookingError = null;
      
      this.step = 1;
      this.sessionType = null;
      this.selectedDate = null;
      this.selectedSlot = null;
      this.selectedFreeSlot = null;
    }
  }

  get hasPendingBooking(): boolean {
    const pendingBooking = sessionStorage.getItem('pendingBooking');
    if (!pendingBooking) return false;
    
    const booking = JSON.parse(pendingBooking);
    const now = new Date().getTime();
    const timeDiff = now - booking.timestamp;
    
    return timeDiff < (5 * 60 * 1000);
  }

  ngOnDestroy(): void {
    window.removeEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    
    if (this.cleanupTimeoutId) {
      clearTimeout(this.cleanupTimeoutId);
    }
    
    const pendingBooking = sessionStorage.getItem('pendingBooking');
    if (pendingBooking) {
      const booking = JSON.parse(pendingBooking);
      const now = new Date().getTime();
      const timeDiff = now - booking.timestamp;
      
      if (timeDiff > 60000) {
        this.cleanupUnpaidBooking(booking.bookingId);
      }
    }
  }

  private handleBeforeUnload(event: BeforeUnloadEvent): void {
    const pendingBooking = sessionStorage.getItem('pendingBooking');
    if (pendingBooking) {
      const booking = JSON.parse(pendingBooking);
      const cleanupData = JSON.stringify({ bookingId: booking.bookingId });
      navigator.sendBeacon(`${environment.apiUrl}/MenteeBookings/${booking.bookingId}/cancel`, cleanupData);
    }
  }

  private isValidAMPMTimeRange(timeRange: string): boolean {
    try {
      const [startStr, endStr] = timeRange.split(' - ');
      if (!startStr || !endStr) return false;

      const startPeriod = startStr.trim().split(' ')[1]?.toUpperCase();
      const endPeriod = endStr.trim().split(' ')[1]?.toUpperCase();
      
      const startHour = parseInt(startStr.trim().split(':')[0]);
      const endHour = parseInt(endStr.trim().split(':')[0]);
      
      if (startPeriod === 'PM' && endPeriod === 'AM') {
        return true;
      }
      
      if (startPeriod === endPeriod) {
        if (startPeriod === 'AM') {
          if (startHour === 12) return endHour !== 12 || endHour > startHour;
          if (endHour === 12) return false;
          return endHour > startHour;
        } else {
          if (startHour === 12) return endHour !== 12 || endHour > startHour;
          if (endHour === 12) return false;
          return endHour > startHour;
        }
      }
      
      if (startPeriod === 'AM' && endPeriod === 'PM') {
        return true;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  private isCrossMidnightTimeRange(timeRange: string): boolean {
    try {
      const [startStr, endStr] = timeRange.split(' - ');
      if (!startStr || !endStr) return false;

      const startPeriod = startStr.trim().split(' ')[1]?.toUpperCase();
      const endPeriod = endStr.trim().split(' ')[1]?.toUpperCase();
      
      return startPeriod === 'PM' && endPeriod === 'AM';
    } catch (error) {
      return false;
    }
  }

  private refreshSlotsAfterConflict(): void {
    if (this.selectedDate) {
      this.availableSlots = this.getSlotsForDate(this.selectedDate);
      
      if (this.availableSlots.length === 0) {
        this.bookingError = `No more available slots for ${this.selectedDate}. Please select a different date.`;
      }
    }
  }

  completePendingBooking(): void {
    const pendingBooking = sessionStorage.getItem('pendingBooking');
    if (!pendingBooking) {
      this.bookingError = 'No pending booking found.';
      return;
    }

    try {
      const booking = JSON.parse(pendingBooking);
      const bookingId = booking.bookingId;
      
      if (!bookingId) {
        this.bookingError = 'Invalid pending booking data.';
        return;
      }

      const storedAmount = sessionStorage.getItem(`booking_${bookingId}_amount`);
      const amount = storedAmount ? parseFloat(storedAmount) : this.calculatedPrice;

      this.router.navigate(['/mentee/payment'], {
        queryParams: {
          bookingId: bookingId,
          amount: amount,
          type: 'complete-booking'
        }
      });
    } catch (error) {
      this.bookingError = 'Error processing pending booking. Please try again.';
    }
  }

}


