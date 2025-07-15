import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MentorBookingService } from '../../../Services/mentor-booking.service';
import { AuthService } from '../../../Services/auth.service';
import { MentorBookingDetails } from '../../../Models/Booking/mentor-booking-details';
import { BookingFilter } from '../../../Models/Booking/booking-filter';
import { BookingStatusUpdate } from '../../../Models/Booking/booking-status-update';
import { BookingStats } from '../../../Models/Booking/booking-stats';
import { BookingAction } from '../../../Models/Booking/booking-action';
import { FloatingDashboardButtonComponent } from '../../../shared/components/floating-dashboard-button/floating-dashboard-button.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-bookings',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, FloatingDashboardButtonComponent],
  templateUrl: './bookings.component.html',
  styleUrls: ['./bookings.component.css']
})
export class BookingsComponent implements OnInit {
  Math = Math;
  
  currentUserId: number = 0;
  allBookings: MentorBookingDetails[] = [];
  filteredBookings: MentorBookingDetails[] = [];
  bookingStats: BookingStats | null = null;
  
  activeTab: string = 'all';
  tabs = [
    { id: 'all', label: 'All Bookings', count: 0 },
    { id: 'upcoming', label: 'Upcoming', count: 0 },
    { id: 'today', label: "Today's Upcoming", count: 0 },
    { id: 'completed', label: 'Completed', count: 0 },
    { id: 'cancelled', label: 'Cancelled', count: 0 }
  ];
  
  // Declare without initialization
  searchForm!: FormGroup;
  rescheduleForm!: FormGroup;

  isLoading: boolean = true;
  isUpdatingStatus: boolean = false;
  isUpdatingMeetingLink: boolean = false;
  error: string | null = null;
  selectedBooking: MentorBookingDetails | null = null;
  showDetailsModal: boolean = false;
  showRescheduleModal: boolean = false;
  showTodaysUpcomingOnly: boolean = false;
  todaysUpcomingBookings: MentorBookingDetails[] = [];
  
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 0;

  constructor(
    private fb: FormBuilder,
    private mentorBookingService: MentorBookingService,
    private authService: AuthService
  ) {
    // Initialize forms here
    this.searchForm = this.fb.group({
      searchQuery: [''],
      statusFilter: [''],        
      sessionTypeFilter: [''],   
      paymentStatusFilter: [''], 
      dateFromFilter: [''],      
      dateToFilter: [''],        
      sortBy: ['date'],
      sortOrder: ['desc']
    });

    this.rescheduleForm = this.fb.group({
      startDate: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      if (user) {
        this.currentUserId = user.userId;
        this.loadBookings();
        this.setupFormSubscriptions(); // Add this line
      }
    });
    this.updateTodaysUpcomingBookings();
  }

  setupFormSubscriptions(): void {
    // Set up real-time filtering
    this.searchForm.valueChanges.subscribe(() => {
      this.currentPage = 1; // Reset to first page when filters change
      this.applyFilters();
    });
  }

  loadBookings(): void {
    this.isLoading = true;
    this.error = null;
    
    this.mentorBookingService.getMentorBookings(this.currentUserId).subscribe({
      next: (bookings) => {
        // Check and auto-update booking statuses before processing
        this.allBookings = this.processBookingStatuses(bookings.map(booking => ({
          ...booking,
          startDateTime: new Date(booking.startDateTime),
          endDateTime: new Date(booking.endDateTime),
          createdAt: new Date(booking.createdAt)
        })));
        
        this.filteredBookings = [...this.allBookings];
        this.bookingStats = this.mentorBookingService.getBookingStats(this.allBookings);
        this.updateTabCounts();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading bookings:', error);
        this.error = 'Failed to load bookings. Please try again.';
        this.isLoading = false;
      }
    });
  }

  // Process booking statuses and auto-update completed sessions
  processBookingStatuses(bookings: MentorBookingDetails[]): MentorBookingDetails[] {
    const now = new Date();
    const updatedBookings: MentorBookingDetails[] = [];
    
    bookings.forEach(booking => {
      const sessionEnd = new Date(booking.endDateTime);
      
      // Auto-complete sessions that have ended but are still marked as InProgress or Confirmed
      if ((booking.status === 'InProgress' || booking.status === 'Confirmed') && now > sessionEnd) {
        console.log(`Auto-completing booking ${booking.bookingId} that ended at ${sessionEnd}`);
        
        // Update the local booking status
        const updatedBooking = { ...booking, status: 'Completed' as const };
        updatedBookings.push(updatedBooking);
        
        // Optionally, update the backend status (fire and forget)
        this.mentorBookingService.updateBookingStatus(booking.bookingId, { status: 'Completed' }).subscribe({
          next: () => console.log(`Successfully auto-completed booking ${booking.bookingId}`),
          error: (error) => console.error(`Failed to auto-complete booking ${booking.bookingId}:`, error)
        });
      } else {
        updatedBookings.push(booking);
      }
    });
    
    return updatedBookings;
  }

  updateTabCounts(): void {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    this.tabs[0].count = this.allBookings.length; // All
    this.tabs[1].count = this.allBookings.filter(b => {
      // A booking is "upcoming" if:
      // 1. It hasn't been cancelled or completed
      // 2. The session hasn't ended yet (based on endDateTime)
      const sessionEnd = new Date(b.endDateTime);
      return (b.status === 'Confirmed' || b.status === 'Pending' || b.status === 'InProgress') && 
             now < sessionEnd;
    }).length; // Upcoming
    this.tabs[2].count = this.allBookings.filter(b => {
      const sessionDate = new Date(b.startDateTime);
      return (
        sessionDate >= now &&
        sessionDate >= startOfToday &&
        sessionDate <= endOfToday &&
        b.status !== 'Completed' && b.status !== 'Cancelled'
      );
    }).length; // Today's Upcoming
    this.tabs[3].count = this.allBookings.filter(b => b.status === 'Completed').length; // Completed
    this.tabs[4].count = this.allBookings.filter(b => b.status === 'Cancelled').length; // Cancelled
  }

  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
    this.currentPage = 1;
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.allBookings];
    const formValues = this.searchForm.value;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Apply tab filter first
    switch (this.activeTab) {
      case 'upcoming':
        filtered = filtered.filter(b => {
          const sessionEnd = new Date(b.endDateTime);
          return (b.status === 'Confirmed' || b.status === 'Pending' || b.status === 'InProgress') && 
                 now < sessionEnd;
        });
        break;
      case 'today':
        filtered = filtered.filter(b => {
          const sessionDate = new Date(b.startDateTime);
          return (
            sessionDate >= now &&
            sessionDate >= startOfToday &&
            sessionDate <= endOfToday &&
            b.status !== 'Completed' && b.status !== 'Cancelled'
          );
        });
        break;
      case 'pending':
        filtered = filtered.filter(b => b.status === 'Pending');
        break;
      case 'completed':
        filtered = filtered.filter(b => b.status === 'Completed');
        break;
      case 'cancelled':
        filtered = filtered.filter(b => b.status === 'Cancelled');
        break;
      // 'all' shows everything
    }
    
    console.log('=== FILTER DEBUG ===');
    console.log('Form values:', formValues);
    console.log('Active tab:', this.activeTab);
    console.log('Initial bookings count:', filtered.length);
    
    // Apply search query
    if (formValues.searchQuery?.trim()) {
      const query = formValues.searchQuery.toLowerCase().trim();
      console.log('Applying search query:', query);
      filtered = filtered.filter(b => 
        b.menteeName.toLowerCase().includes(query) ||
        b.sessionType.toLowerCase().includes(query) ||
        b.bookingId.toString().includes(query)
      );
      console.log('After search filter:', filtered.length);
    }
    
    // Apply status filter (only if not on a specific tab)
    if (formValues.statusFilter && this.activeTab === 'all') {
      console.log('Applying status filter:', formValues.statusFilter);
      filtered = filtered.filter(b => b.status === formValues.statusFilter);
      console.log('After status filter:', filtered.length);
    }
    
    // Apply session type filter
    if (formValues.sessionTypeFilter?.trim()) {
      console.log('Applying session type filter:', formValues.sessionTypeFilter);
      filtered = filtered.filter(b => b.sessionType === formValues.sessionTypeFilter);
      console.log('After session type filter:', filtered.length);
    }
    
    // Apply payment status filter
    if (formValues.paymentStatusFilter?.trim()) {
      console.log('Applying payment status filter:', formValues.paymentStatusFilter);
      filtered = filtered.filter(b => b.paymentStatus === formValues.paymentStatusFilter);
      console.log('After payment status filter:', filtered.length);
    }
    
    // Apply date range filter
    if (formValues.dateFromFilter) {
      const fromDate = new Date(formValues.dateFromFilter);
      fromDate.setHours(0, 0, 0, 0); // Start of day
      console.log('Applying date from filter:', fromDate);
      filtered = filtered.filter(b => new Date(b.startDateTime) >= fromDate);
      console.log('After date from filter:', filtered.length);
    }
    
    if (formValues.dateToFilter) {
      const toDate = new Date(formValues.dateToFilter);
      toDate.setHours(23, 59, 59, 999); // End of day
      console.log('Applying date to filter:', toDate);
      filtered = filtered.filter(b => new Date(b.startDateTime) <= toDate);
      console.log('After date to filter:', filtered.length);
    }
    
    // Apply sorting
    console.log('Applying sort - By:', formValues.sortBy, 'Order:', formValues.sortOrder);
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (formValues.sortBy) {
        case 'mentee':
          aValue = a.menteeName.toLowerCase();
          bValue = b.menteeName.toLowerCase();
          break;
        case 'status':
          aValue = a.status.toLowerCase();
          bValue = b.status.toLowerCase();
          break;
        case 'amount':
          aValue = a.totalAmount;
          bValue = b.totalAmount;
          break;
        default: // date
          aValue = new Date(a.startDateTime);
          bValue = new Date(b.startDateTime);
      }
      
      if (formValues.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    this.filteredBookings = filtered;
    this.totalPages = Math.ceil(filtered.length / this.pageSize);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);

    this.updateTodaysUpcomingBookings();

    console.log('Final filtered count:', filtered.length);
    console.log('=== END FILTER DEBUG ===');
  }

  updateTodaysUpcomingBookings(): void {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    this.todaysUpcomingBookings = this.allBookings.filter(b => {
      const sessionDate = new Date(b.startDateTime);
      return (
        sessionDate >= now &&
        sessionDate >= startOfToday &&
        sessionDate <= endOfToday &&
        b.status !== 'Completed' && b.status !== 'Cancelled'
      );
    });
  }

  getPaginatedBookings(): MentorBookingDetails[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredBookings.slice(startIndex, endIndex);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  clearFilters(): void {
    this.searchForm.reset({
      searchQuery: '',
      statusFilter: '',
      sessionTypeFilter: '',
      paymentStatusFilter: '',
      dateFromFilter: '',
      dateToFilter: '',
      sortBy: 'date',
      sortOrder: 'desc'
    });
    this.currentPage = 1;
  }

  clearSearch(): void {
    this.searchForm.patchValue({ searchQuery: '' });
  }

  getActions(booking: MentorBookingDetails): BookingAction[] {
    return this.mentorBookingService.getAvailableActions(booking);
  }

  executeAction(action: BookingAction, booking: MentorBookingDetails): void {
    switch (action.type) {
      case 'confirm':
        this.confirmBooking(booking);
        break;
      case 'cancel':
        this.cancelBooking(booking);
        break;
      case 'complete':
        this.completeBooking(booking);
        break;
      case 'join':
        this.joinSession(booking);
        break;
      case 'reschedule':
        this.openRescheduleModal(booking);
        break;
      case 'view':
        this.viewBookingDetails(booking);
        break;
    }
  }

  confirmBooking(booking: MentorBookingDetails): void {
    Swal.fire({
      title: 'Confirm Booking?',
      html: `
        <div class="text-start">
          <p class="mb-2"><strong>Session:</strong> ${booking.sessionType}</p>
          <p class="mb-2"><strong>Mentee:</strong> ${booking.menteeName}</p>
          <p class="mb-2"><strong>Date:</strong> ${this.mentorBookingService.formatDateTime(booking.startDateTime)}</p>
          <p class="text-muted mb-0">This will confirm the booking and notify the mentee.</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0a2e65',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '<i class="fas fa-check me-2"></i>Confirm Booking',
      cancelButtonText: 'Cancel',
      customClass: {
        popup: 'rounded-4',
        confirmButton: 'rounded-pill px-4',
        cancelButton: 'rounded-pill px-4'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.updateBookingStatus(booking, { status: 'Confirmed' });
      }
    });
  }

  cancelBooking(booking: MentorBookingDetails): void {
    Swal.fire({
      title: 'Cancel Booking?',
      html: `
        <div class="text-start">
          <p class="mb-2"><strong>Session:</strong> ${booking.sessionType}</p>
          <p class="mb-2"><strong>Mentee:</strong> ${booking.menteeName}</p>
          <p class="mb-2"><strong>Date:</strong> ${this.mentorBookingService.formatDateTime(booking.startDateTime)}</p>
          <div class="mt-3">
            <label for="cancelReason" class="form-label"><strong>Reason for cancellation:</strong></label>
            <textarea id="cancelReason" class="form-control" rows="3" placeholder="Please provide a reason for cancellation..."></textarea>
          </div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '<i class="fas fa-times me-2"></i>Cancel Booking',
      cancelButtonText: 'Keep Booking',
      customClass: {
        popup: 'rounded-4',
        confirmButton: 'rounded-pill px-4',
        cancelButton: 'rounded-pill px-4'
      },
      preConfirm: () => {
        const reason = (document.getElementById('cancelReason') as HTMLTextAreaElement)?.value;
        if (!reason?.trim()) {
          Swal.showValidationMessage('Please provide a reason for cancellation');
          return false;
        }
        return reason;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.updateBookingStatus(booking, { 
          status: 'Cancelled', 
          reason: result.value 
        });
      }
    });
  }

  completeBooking(booking: MentorBookingDetails): void {
    Swal.fire({
      title: 'Mark Session as Complete?',
      html: `
        <div class="text-start">
          <p class="mb-2"><strong>Session:</strong> ${booking.sessionType}</p>
          <p class="mb-2"><strong>Mentee:</strong> ${booking.menteeName}</p>
          <p class="mb-2"><strong>Date:</strong> ${this.mentorBookingService.formatDateTime(booking.startDateTime)}</p>
          <p class="text-muted mb-0">This will mark the session as completed and process the payment.</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#198754',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '<i class="fas fa-check-circle me-2"></i>Mark Complete',
      cancelButtonText: 'Cancel',
      customClass: {
        popup: 'rounded-4',
        confirmButton: 'rounded-pill px-4',
        cancelButton: 'rounded-pill px-4'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.updateBookingStatus(booking, { status: 'Completed' });
      }
    });
  }

  joinSession(booking: MentorBookingDetails): void {
    // Show loading
    Swal.fire({
      title: 'Joining Session...',
      text: 'Please wait while we prepare your session.',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.mentorBookingService.joinBooking(booking.bookingId).subscribe({
      next: (joinInfo) => {
        Swal.close();
        
        // Update booking status to InProgress if confirmed
        if (booking.status === 'Confirmed') {
          this.updateBookingStatus(booking, { status: 'InProgress' }, false);
        }
        
        // Open Google Meet in new tab
        window.open(joinInfo.meetLink, '_blank');
        
        // Show success message
        Swal.fire({
          icon: 'success',
          title: 'Session Joined!',
          text: 'The Google Meet window should open in a new tab.',
          timer: 3000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      },
      error: (error) => {
        console.error('Error joining session:', error);
        Swal.fire({
          icon: 'error',
          title: 'Failed to Join',
          text: 'Unable to join the session. Please try again.',
          confirmButtonColor: '#0a2e65'
        });
      }
    });
  }

  updateBookingStatus(booking: MentorBookingDetails, statusUpdate: BookingStatusUpdate, showSuccess: boolean = true): void {
    this.isUpdatingStatus = true;
    
    this.mentorBookingService.updateBookingStatus(booking.bookingId, statusUpdate).subscribe({
      next: (updatedBooking) => {
        // Update the booking in our arrays
        const index = this.allBookings.findIndex(b => b.bookingId === booking.bookingId);
        if (index !== -1) {
          this.allBookings[index] = {
            ...updatedBooking,
            startDateTime: new Date(updatedBooking.startDateTime),
            endDateTime: new Date(updatedBooking.endDateTime),
            createdAt: new Date(updatedBooking.createdAt)
          };
        }
        
        this.bookingStats = this.mentorBookingService.getBookingStats(this.allBookings);
        this.updateTabCounts();
        this.applyFilters();
        this.isUpdatingStatus = false;
        
        if (showSuccess) {
          Swal.fire({
            icon: 'success',
            title: 'Status Updated!',
            text: `Booking status updated to ${statusUpdate.status}.`,
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });
        }
      },
      error: (error) => {
        this.isUpdatingStatus = false;
        console.error('Error updating booking status:', error);
        
        Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: 'Failed to update booking status. Please try again.',
          confirmButtonColor: '#0a2e65'
        });
      }
    });
  }

  openRescheduleModal(booking: MentorBookingDetails): void {
    this.selectedBooking = booking;
    
    // Pre-fill form with current booking details
    const startDate = new Date(booking.startDateTime);
    const endTime = new Date(booking.endDateTime);
    
    this.rescheduleForm.patchValue({
      startDate: startDate.toISOString().split('T')[0],
      startTime: startDate.toTimeString().slice(0, 5),
      endTime: endTime.toTimeString().slice(0, 5)
    });
    
    this.showRescheduleModal = true;
  }

  submitReschedule(): void {
    if (this.rescheduleForm.valid && this.selectedBooking) {
      const formData = this.rescheduleForm.value;
      
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}:00`);
      const endDateTime = new Date(`${formData.startDate}T${formData.endTime}:00`);
      
      // Validate end time is after start time
      if (endDateTime <= startDateTime) {
        Swal.fire({
          icon: 'warning',
          title: 'Invalid Time',
          text: 'End time must be after start time.',
          confirmButtonColor: '#0a2e65'
        });
        return;
      }
      
      // Show loading
      Swal.fire({
        title: 'Rescheduling...',
        text: 'Please wait while we reschedule your booking.',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      
      this.mentorBookingService.rescheduleBooking(
        this.selectedBooking.bookingId,
        startDateTime,
        endDateTime
      ).subscribe({
        next: (updatedBooking) => {
          // Update the booking in our arrays
          const index = this.allBookings.findIndex(b => b.bookingId === this.selectedBooking!.bookingId);
          if (index !== -1) {
            this.allBookings[index] = {
              ...updatedBooking,
              startDateTime: new Date(updatedBooking.startDateTime),
              endDateTime: new Date(updatedBooking.endDateTime),
              createdAt: new Date(updatedBooking.createdAt)
            };
          }
          
          this.applyFilters();
          this.closeRescheduleModal();
          
          Swal.fire({
            icon: 'success',
            title: 'Rescheduled!',
            text: 'Booking has been rescheduled successfully.',
            confirmButtonColor: '#0a2e65'
          });
        },
        error: (error) => {
          console.error('Error rescheduling booking:', error);
          
          let errorMessage = 'Failed to reschedule booking. Please try again.';
          if (error.status === 409) {
            errorMessage = 'You have another booking during the requested time.';
          }
          
          Swal.fire({
            icon: 'error',
            title: 'Reschedule Failed',
            text: errorMessage,
            confirmButtonColor: '#0a2e65'
          });
        }
      });
    } else {
      this.markFormGroupTouched(this.rescheduleForm);
    }
  }

  closeRescheduleModal(): void {
    this.showRescheduleModal = false;
    this.selectedBooking = null;
    this.rescheduleForm.reset();
  }

  viewBookingDetails(booking: MentorBookingDetails): void {
    this.selectedBooking = booking;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedBooking = null;
  }

  getStatusBadgeClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending': return 'badge bg-warning text-dark';
      case 'confirmed': return 'badge bg-info text-white';
      case 'inprogress': return 'badge bg-primary text-white blink'; // Add blinking for active sessions
      case 'completed': return 'badge bg-success text-white';
      case 'cancelled': return 'badge bg-danger text-white';
      default: return 'badge bg-secondary text-white';
    }
  }

  getPaymentStatusBadgeClass(paymentStatus: string): string {
    return this.mentorBookingService.getPaymentStatusBadgeClass(paymentStatus);
  }

  formatDateTime(dateTime: Date | string): string {
    return this.mentorBookingService.formatDateTime(dateTime);
  }

  getTimeUntilSession(booking: MentorBookingDetails): string {
    return this.mentorBookingService.getTimeUntilSession(booking);
  }

  isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['min']) return `${fieldName} value is too low`;
      if (field.errors['max']) return `${fieldName} value is too high`;
    }
    return '';
  }

  markFormGroupTouched(form: FormGroup): void {
    Object.keys(form.controls).forEach(key => {
      form.get(key)?.markAsTouched();
    });
  }

  // Add this temporary debug method
  debugBookingData(): void {
    console.log('=== BOOKING DATA DEBUG ===');
    console.log('Total bookings:', this.allBookings.length);
    
    if (this.allBookings.length > 0) {
      const firstBooking = this.allBookings[0];
      console.log('Sample booking:', firstBooking);
      console.log('Status values in data:', [...new Set(this.allBookings.map(b => b.status))]);
      console.log('Session types in data:', [...new Set(this.allBookings.map(b => b.sessionType))]);
      console.log('Payment statuses in data:', [...new Set(this.allBookings.map(b => b.paymentStatus))]);
    }
    console.log('=== END BOOKING DATA DEBUG ===');
  }

  // Add this method for copying Google Meet links
  copyToClipboard(text: string): void {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        Swal.fire({
          icon: 'success',
          title: 'Copied!',
          text: 'Google Meet link copied to clipboard.',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      }).catch((error) => {
        console.error('Failed to copy to clipboard:', error);
        this.fallbackCopyToClipboard(text);
      });
    } else {
      this.fallbackCopyToClipboard(text);
    }
  }

  // Fallback copy method for older browsers
  private fallbackCopyToClipboard(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      Swal.fire({
        icon: 'success',
        title: 'Copied!',
        text: 'Google Meet link copied to clipboard.',
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    } catch (error) {
      console.error('Fallback copy failed:', error);
      Swal.fire({
        icon: 'error',
        title: 'Copy Failed',
        text: 'Could not copy to clipboard. Please copy manually.',
        confirmButtonColor: '#0a2e65'
      });
    } finally {
      document.body.removeChild(textArea);
    }
  }

  // Add this method to your BookingsComponent class
  canShowJoinButton(booking: MentorBookingDetails): boolean {
    // Must have meeting link set
    if (!booking.googleMeetLink) {
      return false;
    }
    
    // Must be confirmed or in progress
    if (booking.status !== 'Confirmed' && booking.status !== 'InProgress') {
      return false;
    }
    
    // Must be paid
    if (booking.paymentStatus !== 'Paid') {
      return false;
    }
    
    return true;
  }

  // Add this method to handle join functionality
  joinSessionFromBookings(booking: MentorBookingDetails): void {
    if (!booking.googleMeetLink) {
      Swal.fire({
        icon: 'warning',
        title: 'No Meeting Link',
        text: 'Please set up the meeting link first.',
        confirmButtonColor: '#0a2e65'
      });
      return;
    }

    console.log('Joining session:', booking.bookingId);
    
    this.mentorBookingService.joinBooking(booking.bookingId).subscribe({
      next: (joinInfo) => {
        // Update status locally if needed
        if (booking.status === 'Confirmed') {
          booking.status = 'InProgress';
        }
        
        // Open the meeting link
        window.open(joinInfo.meetLink, '_blank');
        
        Swal.fire({
          icon: 'success',
          title: 'Session Joined!',
          text: 'Opening meeting in new tab...',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      },
      error: (error) => {
        console.error('Error joining session:', error);
        let errorMessage = 'Unable to join the session.';
        
        if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        Swal.fire({
          icon: 'error',
          title: 'Cannot Join Session',
          text: errorMessage,
          confirmButtonColor: '#0a2e65'
        });
      }
    });
  }

  updateMeetingLink(booking: MentorBookingDetails): void {
    if (!booking.meetingLinkInput?.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Link',
        text: 'Please enter a valid meeting link.',
        confirmButtonColor: '#0a2e65'
      });
      return;
    }

    this.isUpdatingMeetingLink = true;

    this.mentorBookingService.updateMeetingLink(booking.bookingId, booking.meetingLinkInput).subscribe({
      next: (response: any) => { // Add explicit type
        if (response.success) {
          booking.googleMeetLink = booking.meetingLinkInput;
          booking.meetingLinkInput = '';
          
          const index = this.allBookings.findIndex(b => b.bookingId === booking.bookingId);
          if (index !== -1) {
            this.allBookings[index].googleMeetLink = booking.googleMeetLink;
          }

          Swal.fire({
            icon: 'success',
            title: 'Link Saved!',
            text: 'Meeting link has been saved successfully.',
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });
        }
      },
      error: (error: any) => { // Add explicit type
        console.error('Error updating meeting link:', error);
        Swal.fire({
          icon: 'error',
          title: 'Failed to Save',
          text: 'Please check the link format and try again.',
          confirmButtonColor: '#0a2e65'
        });
      },
      complete: () => {
        this.isUpdatingMeetingLink = false;
      }
    });
  }

  editMeetingLink(booking: MentorBookingDetails): void {
    booking.meetingLinkInput = booking.googleMeetLink || '';
    // Fix the type issue by setting to undefined instead of null
    booking.googleMeetLink = undefined;
  }

  copyMeetingLink(booking: MentorBookingDetails): void {
    if (booking.googleMeetLink) {
      navigator.clipboard.writeText(booking.googleMeetLink);
      Swal.fire({
        icon: 'success',
        title: 'Copied!',
        text: 'Meeting link copied to clipboard.',
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    }
  }
}