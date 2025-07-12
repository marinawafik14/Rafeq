import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { menteeBookingservice } from '../../Services/menteeBooking.service';
import { MenteeLayoutComponent } from '../mentee-layout.component';
import { AuthService } from '../../Services/auth.service';
import { environment } from '../../environments/environment.development';

@Component({
  selector: 'app-mentee-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule, MenteeLayoutComponent],
  templateUrl: './mentee-bookings.component.html',
  styleUrls: ['./mentee-bookings.component.css']
})
export class MenteeBookingsComponent implements OnInit {
  stats = [
    { label: 'Completed', value: 0, icon: 'bi-check-circle', color: '#10b981' },
    { label: 'Confirmed', value: 0, icon: 'bi-calendar-check', color: '#4f46e5' },
    { label: 'Cancelled', value: 0, icon: 'bi-x-circle', color: '#ef4444' }
  ];

  allBookings: any[] = [];
  completedBookings: any[] = [];
  confirmedBookings: any[] = [];
  cancelledBookings: any[] = [];
  filteredBookings: any[] = [];

  isLoading = true;
  currentPage = 1;
  pageSize = 6;
  totalPages = 1;
  totalItems = 0;
  activeTab: string = 'confirmed';

  menteeId: number | null = null;
  menteeName: string = '';

  showCancelModal = false;
  bookingToCancel: any = null;
  
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'info';
  private toastTimeout: any;

  searchTerm: string = '';
  sortBy: string = 'date-desc';

  selectedDate: string = '';
  onDateChange(event: any) {
    this.selectedDate = event.target.value;
    this.filterAndSortBookings();
    this.currentPage = 1;
  }

  clearDateFilter() {
    this.selectedDate = '';
    this.filterAndSortBookings();
  }

  constructor(
    private authService: AuthService,
    private router: Router,
    private menteeBookingservice: menteeBookingservice,
    private http: HttpClient
  ) {}

  ngOnInit() {
    const user = this.authService.currentUserValue;
    this.menteeId = user && user.userId ? user.userId : null;
    if (!this.menteeId) return;
    this.menteeName = (user as any)?.firstName || 'Mentee';
    this.loadBookingsData(this.menteeId);
  }

  loadBookingsData(menteeId: number) {
    this.isLoading = true;
    this.menteeBookingservice.getAllBookings(menteeId).subscribe({
      next: (bookings) => {
        this.allBookings = bookings;
        this.categorizeBookings();
        this.calculateStats();
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
      }
    });
  }

  categorizeBookings() {
    this.completedBookings = this.allBookings.filter(booking => 
      booking.status?.toLowerCase() === 'completed'
    );
    
    this.confirmedBookings = this.allBookings.filter(booking => 
      booking.status?.toLowerCase() === 'confirmed'
    );
    
    this.cancelledBookings = this.allBookings.filter(booking => 
      booking.status?.toLowerCase() === 'cancelled'
    );
    
    this.filterAndSortBookings();
  }

  calculateStats() {
    this.stats[0].value = this.completedBookings.length;
    this.stats[1].value = this.confirmedBookings.length;
    this.stats[2].value = this.cancelledBookings.length;
  }

  getCurrentBookings(): any[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredBookings.slice(startIndex, endIndex);
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
    this.currentPage = 1;
    this.filterAndSortBookings();
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getPaginationRange(): number[] {
    const range = [];
    const maxButtons = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxButtons / 2));
    let end = Math.min(this.totalPages, start + maxButtons - 1);
    
    if (end - start < maxButtons - 1) {
      start = Math.max(1, end - maxButtons + 1);
    }
    
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    return range;
  }

  get startItem(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }

  formatTime(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
  }

  getStatusBadgeClass(status: string): string {
    if (!status) return 'status-unknown';
    switch (status.toLowerCase()) {
      case 'confirmed': return 'status-confirmed';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-unknown';
    }
  }

  trackByStat(index: number, stat: any): any {
    return stat.label;
  }

  trackByBooking(index: number, booking: any): any {
    return booking.bookingId;
  }

  canJoinSession(booking: any): boolean {
    if (!booking || 
        !booking.googleMeetLink || 
        booking.status?.toLowerCase() !== 'confirmed') {
      return false;
    }
    
    const meetLink = booking.googleMeetLink.trim();
    if (!meetLink) {
      return false;
    }
    
    const now = new Date();
    const startTime = new Date(booking.startDateTime);
    
    const nowUTC = new Date(Date.UTC(
      now.getUTCFullYear(), 
      now.getUTCMonth(), 
      now.getUTCDate(),
      now.getUTCHours(),
      now.getUTCMinutes()
    ));
    
    const timeDiff = startTime.getTime() - nowUTC.getTime();
    const minutesDiff = timeDiff / (1000 * 60);
    
    return minutesDiff <= 5 && minutesDiff >= -60;
  }

  joinSession(booking: any) {
    if (!booking || !booking.googleMeetLink) {
      this.showToaster('Meeting link is not available for this session.', 'warning');
      return;
    }
    
    const meetLink = booking.googleMeetLink.trim();
    if (!meetLink) {
      this.showToaster('Meeting link is empty or invalid.', 'warning');
      return;
    }
    
    if (!meetLink.startsWith('http://') && !meetLink.startsWith('https://')) {
      this.showToaster('Invalid meeting link format.', 'error');
      return;
    }
    
    window.open(meetLink, '_blank');
  }

  navigateToSearchMentors() {
    this.router.navigate(['/mentee/search-mentors']);
  }

  getBookingById(bookingId: number) {
    return this.http.get(`${environment.apiUrl}/Bookings/${bookingId}`);
  }

  viewBookingDetails(booking: any) {
    const id = booking.bookingId || booking.id;
    if (!id) return;
    this.getBookingById(id).subscribe({
      next: (data) => {
        this.router.navigate(['/mentee/booking-details', id]);
      },
      error: _ => {
        this.router.navigate(['/mentee/booking-details', id]);
      }
    });
  }

  confirmCancel(booking: any) {
    if (this.isSessionInPast(booking)) {
      this.showToaster('Cannot cancel a session that has already started or passed.', 'warning');
      return;
    }
    
    if (!this.canCancelBooking(booking)) {
      this.showToaster('This booking cannot be cancelled.', 'warning');
      return;
    }
    
    this.bookingToCancel = booking;
    this.showCancelModal = true;
    
    document.body.classList.add('modal-open');
  }

  closeCancelModal() {
    this.showCancelModal = false;
    this.bookingToCancel = null;
    
    document.body.classList.remove('modal-open');
  }

  confirmCancelBooking() {
    if (!this.bookingToCancel || !this.menteeId) return;
    
    const bookingId = this.bookingToCancel.bookingId || this.bookingToCancel.id;
    
    if (this.isSessionInPast(this.bookingToCancel)) {
      this.showToaster('Cannot cancel a session that has already started or passed.', 'warning');
      this.closeCancelModal();
      return;
    }
    
    this.menteeBookingservice.cancelBooking(bookingId).subscribe({
      next: (response) => {
        const bookingIndex = this.allBookings.findIndex(b => 
          (b.bookingId || b.id) === bookingId
        );
        
        if (bookingIndex >= 0) {
          this.allBookings[bookingIndex].status = 'Cancelled';
          this.categorizeBookings();
          this.calculateStats();
        }
        
        this.closeCancelModal();
        this.showToaster('Booking cancelled successfully.', 'success');
      },
      error: (err) => {
        if (err.error && typeof err.error === 'string') {
          this.showToaster(`Failed to cancel booking: ${err.error}`, 'error');
        } else {
          this.showToaster('Failed to cancel booking. Please try again later.', 'error');
        }
        
        this.closeCancelModal();
      }
    });
  }

  isSessionInPast(booking: any): boolean {
    if (!booking || !booking.startDateTime) return false;
    
    const sessionDate = new Date(booking.startDateTime);
    const now = new Date();
    
    const nowUTC = new Date(Date.UTC(
      now.getUTCFullYear(), 
      now.getUTCMonth(), 
      now.getUTCDate(),
      now.getUTCHours(),
      now.getUTCMinutes()
    ));
    
    return sessionDate < nowUTC;
  }

  canCancelBooking(booking: any): boolean {
    if (!booking || !booking.status) return false;
    return booking.status.toLowerCase() === 'confirmed' && !this.isSessionInPast(booking);
  }



  applySorting(bookings: any[]): any[] {
    if (!bookings || bookings.length === 0) return [];
    
    return [...bookings].sort((a, b) => {
      const dateA = new Date(a.startDateTime || a.startTime || new Date());
      const dateB = new Date(b.startDateTime || b.startTime || new Date());
      
      switch (this.sortBy) {
        case 'date-asc':
          return dateA.getTime() - dateB.getTime();
        case 'date-desc':
          return dateB.getTime() - dateA.getTime();
        case 'price-asc':
          return (a.totalAmount || 0) - (b.totalAmount || 0);
        case 'price-desc':
          return (b.totalAmount || 0) - (a.totalAmount || 0);
        default:
          return dateB.getTime() - dateA.getTime();
      }
    });
  }

  changeSorting(sortOption: string) {
    this.sortBy = sortOption;
    this.filterAndSortBookings();
  }

  applySearch(bookings: any[]): any[] {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      return bookings;
    }
    
    const searchLower = this.searchTerm.toLowerCase().trim();
    
    return bookings.filter(booking => {
      return (
        (booking.mentorName || '').toLowerCase().includes(searchLower) ||
        (booking.bookingId?.toString() || '').includes(searchLower) ||
        (booking.sessionType || '').toLowerCase().includes(searchLower) ||
        this.formatDate(booking.startDateTime)?.toLowerCase().includes(searchLower) ||
        (booking.status || '').toLowerCase().includes(searchLower)
      );
    });
  }

  onSearchChange(event: any) {
    this.searchTerm = event.target.value;
    this.filterAndSortBookings();
    this.currentPage = 1;
  }

  clearSearch() {
    this.searchTerm = '';
    this.filterAndSortBookings();
  }

  filterAndSortBookings() {
    let tabFilteredBookings: any[] = [];
    switch (this.activeTab) {
      case 'confirmed':
        tabFilteredBookings = this.confirmedBookings;
        break;
      case 'completed':
        tabFilteredBookings = this.completedBookings;
        break;
      case 'cancelled':
        tabFilteredBookings = this.cancelledBookings;
        break;
      default:
        tabFilteredBookings = this.confirmedBookings;
    }

    let dateFilteredBookings = tabFilteredBookings;
    if (this.selectedDate) {
      dateFilteredBookings = tabFilteredBookings.filter(booking => {
        if (!booking.startDateTime) return false;
        const bookingDate = new Date(booking.startDateTime);
       const bookingDateStr = bookingDate.toISOString().slice(0, 10);
        return bookingDateStr === this.selectedDate;
      });
    }

    const searchFilteredBookings = this.applySearch(dateFilteredBookings);
    this.filteredBookings = this.applySorting(searchFilteredBookings);
    this.totalItems = this.filteredBookings.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.updatePaginationInfo();
  }

  updatePaginationInfo() {
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    } else if (this.totalPages === 0) {
      this.currentPage = 1;
    }
  }

  getEmptyStateMessage(): string {
    if (this.searchTerm) {
      return `No results found for "${this.searchTerm}"`;
    }
    return `You don't have any ${this.activeTab} bookings at the moment.`;
  }

  getJoinTimeMessage(booking: any): string {
    if (!booking || !booking.startDateTime) return '';
    
    const now = new Date();
    const startTime = new Date(booking.startDateTime);
    
    const nowUTC = new Date(Date.UTC(
      now.getUTCFullYear(), 
      now.getUTCMonth(), 
      now.getUTCDate(),
      now.getUTCHours(),
      now.getUTCMinutes()
    ));
    
    const timeDiff = startTime.getTime() - nowUTC.getTime();
    const minutesDiff = Math.round(timeDiff / (1000 * 60));
    
    if (minutesDiff > 5) {
      const days = Math.floor(minutesDiff / (60 * 24));
      const hours = Math.floor((minutesDiff % (60 * 24)) / 60);
      const minutes = minutesDiff % 60;
      
      if (days > 0) {
        return `in ${days}d ${hours}h ${minutes}m`;
      } else if (hours > 0) {
        return `in ${hours}h ${minutes}m`;
      } else {
        return `in ${minutes}m`;
      }
    } else if (minutesDiff < -60) {
      return '(session expired)';
    } else {
      return 'now';
    }
  }

  showToaster(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;

    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }

    this.toastTimeout = setTimeout(() => {
      this.hideToaster();
    }, 4000);
  }

  hideToaster() {
    this.showToast = false;
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
      this.toastTimeout = null;
    }
  }
}
