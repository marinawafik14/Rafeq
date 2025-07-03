import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { menteeBookingservice } from '../../Services/menteeBooking.service';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MenteeLayoutComponent } from '../mentee-layout.component';
import { AuthService } from '../../Services/auth.service';

@Component({
  selector: 'app-mentee-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule, MenteeLayoutComponent],
  templateUrl: './mentee-bookings.component.html',
  styleUrls: ['./mentee-bookings.component.css']
})
export class MenteeBookingsComponent implements OnInit {
  // Statistics for the 5 cards
  stats = [
    { label: 'Pending', value: 0, icon: 'bi-clock-history', color: '#f59e0b' },
    { label: 'Completed', value: 0, icon: 'bi-check-circle', color: '#10b981' },
    { label: 'Confirmed', value: 0, icon: 'bi-calendar-check', color: '#4f46e5' },
    { label: 'Cancelled', value: 0, icon: 'bi-x-circle', color: '#ef4444' },
    { label: 'Total', value: 0, icon: 'bi-calendar-week', color: '#6366f1' }
  ];

  // All bookings from API
  allBookings: any[] = [];
  
  // Categorized bookings for cards
  pendingBookings: any[] = [];
  completedBookings: any[] = [];
  confirmedBookings: any[] = [];
  cancelledBookings: any[] = [];

  // Dashboard loading state
  isLoading = true;
  
  // Pagination properties
  currentPage = 1;
  pageSize = 6;
  totalPages = 1;
  totalItems = 0;
  
  // Active tab for displaying different booking categories
  activeTab: string = 'pending';

  // Mentee info
  menteeId: number | null = null;
  menteeName: string = '';

  // Legacy properties for existing functionality
  bookings: any[] = [];
  tab: 'upcoming' | 'past' | 'all' = 'all';
  page = 1;
  search = '';
  filterStatus = '';
  showCancelModal = false;
  bookingToCancel: any = null;

  // Import and declare a variable for the modal
  private cancelModalElement: any = null;

  // Search and sorting properties
  searchTerm: string = '';
  sortBy: string = 'date-desc'; // Default sort: newest first
  filteredBookings: any[] = [];

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private menteeBookingservice: menteeBookingservice,
    private http: HttpClient
  ) {}

  ngOnInit() {
    // Get menteeId from AuthService (currentUserValue)
    const user = this.authService.currentUserValue;
    this.menteeId = user && user.userId ? user.userId : null;
    if (!this.menteeId) {
      console.error('No valid menteeId found. Please log in again.');
      return;
    }
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
        console.error('Error loading bookings:', error);
        this.isLoading = false;
      }
    });
  }

  categorizeBookings() {
    console.log('All bookings:', this.allBookings);
    
    // Debug each booking's status
    this.allBookings.forEach(booking => {
      console.log(`Booking ${booking.bookingId}: status=${booking.status}, googleMeetLink=${booking.googleMeetLink || 'none'}`);
    });
    
    this.pendingBookings = this.allBookings.filter(booking => 
      booking.status?.toLowerCase() === 'pending'
    );
    
    this.completedBookings = this.allBookings.filter(booking => 
      booking.status?.toLowerCase() === 'completed'
    );
    
    this.confirmedBookings = this.allBookings.filter(booking => 
      booking.status?.toLowerCase() === 'confirmed'
    );
    
    this.cancelledBookings = this.allBookings.filter(booking => 
      booking.status?.toLowerCase() === 'cancelled'
    );
    
    console.log('Confirmed bookings:', this.confirmedBookings);
    
    // Initialize filtered bookings
    this.filterAndSortBookings();
  }

  calculateStats() {
    this.stats[0].value = this.pendingBookings.length; // Pending
    this.stats[1].value = this.completedBookings.length; // Completed
    this.stats[2].value = this.confirmedBookings.length; // Confirmed
    this.stats[3].value = this.cancelledBookings.length; // Cancelled
    this.stats[4].value = this.allBookings.length; // Total
  }

  // Get bookings for current tab and page
  getCurrentBookings(): any[] {
    // Use filtered bookings with pagination
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredBookings.slice(startIndex, endIndex);
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
    this.currentPage = 1;
    // Apply filtering and sorting when tab changes
    this.filterAndSortBookings();
  }

  // Pagination methods
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      // No need to call filterAndSortBookings again since we're just changing page
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

  // Utility methods
  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }

  formatTime(dateString: string): string {
    if (!dateString) return 'N/A';
    
    // Explicitly handle the timezone by specifying timeZone: 'UTC'
    // This prevents browser's local timezone from affecting the display
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC'  // Display in UTC to match API's time
    });
  }

  getStatusBadgeClass(status: string): string {
    if (!status) return 'status-unknown';
    switch (status.toLowerCase()) {
      case 'pending': return 'status-pending';
      case 'confirmed': return 'status-confirmed';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-unknown';
    }
  }

  canJoinSession(booking: any): boolean {
    // Make sure we have a valid booking with a meeting link and confirmed status
    if (!booking || 
        !booking.googleMeetLink || 
        booking.status?.toLowerCase() !== 'confirmed') {
      return false;
    }
    
    // Trim the Google Meet link and check if it's not empty
    const meetLink = booking.googleMeetLink.trim();
    if (!meetLink) {
      return false;
    }
    
    // Check if session is within the join window using UTC time to match API
    const now = new Date();
    const startTime = new Date(booking.startDateTime);
    
    // Ensure we're comparing in the same timezone (UTC)
    const nowUTC = new Date(Date.UTC(
      now.getUTCFullYear(), 
      now.getUTCMonth(), 
      now.getUTCDate(),
      now.getUTCHours(),
      now.getUTCMinutes()
    ));
    
    const timeDiff = startTime.getTime() - nowUTC.getTime();
    const minutesDiff = timeDiff / (1000 * 60);
    
    // Can join only 5 minutes before session start and up to 60 minutes after start time
    return minutesDiff <= 5 && minutesDiff >= -60;
    
    // For testing only - uncomment the line below
    // return true; // Always allow joining for testing
  }

  joinSession(booking: any) {
    if (!booking || !booking.googleMeetLink) {
      alert('Meeting link is not available for this session.');
      return;
    }
    
    const meetLink = booking.googleMeetLink.trim();
    if (!meetLink) {
      alert('Meeting link is empty or invalid.');
      return;
    }
    
    // Check if the link is valid (starts with http or https)
    if (!meetLink.startsWith('http://') && !meetLink.startsWith('https://')) {
      alert('Invalid meeting link format.');
      return;
    }
    
    // Open the meeting link in a new tab
    window.open(meetLink, '_blank');
  }

  navigateToSearchMentors() {
    this.router.navigate(['/mentee/search-mentors']);
  }

  trackByStat(index: number, stat: any): any {
    return stat.label;
  }

  trackByBooking(index: number, booking: any): any {
    return booking.bookingId;
  }

  fetchBookingsForTab() {
    if (!this.menteeId) return;
    if (this.tab === 'all') {
      this.menteeBookingservice.getAllBookings(this.menteeId).subscribe({
        next: (data) => this.bookings = data,
        error: _ => this.bookings = []
      });
    } else if (this.tab === 'upcoming') {
      this.menteeBookingservice.getUpcomingBookings(this.menteeId).subscribe({
        next: (data) => this.bookings = data,
        error: _ => this.bookings = []
      });
    } else if (this.tab === 'past') {
      this.menteeBookingservice.getCompletedBookings(this.menteeId).subscribe({
        next: (data) => this.bookings = data,
        error: _ => this.bookings = []
      });
    }
  }

  setTab(tab: 'upcoming' | 'past' | 'all') {
    this.tab = tab;
    this.page = 1;
    this.search = '';
    this.filterStatus = '';
    this.fetchBookingsForTab();
  }

  // Legacy methods - renamed to avoid conflicts
  get legacyFilteredBookings() {
    let filtered = this.bookings;
    if (this.search) {
      filtered = filtered.filter(b => b.mentorName?.toLowerCase().includes(this.search.toLowerCase()));
    }
    if (this.filterStatus) {
      filtered = filtered.filter(b => b.status === this.filterStatus);
    }
    const startIdx = (this.page - 1) * this.pageSize;
    return filtered.slice(startIdx, startIdx + this.pageSize);
  }

  get totalFiltered() {
    return this.legacyFilteredBookings.length;
  }

  // Legacy search - renamed to avoid conflicts
  legacySearchChange(event: Event) {
    this.search = (event.target as HTMLInputElement).value;
    this.page = 1;
  }

  onFilterChange(event: Event) {
    this.filterStatus = (event.target as HTMLSelectElement).value;
    this.page = 1;
  }

  onPageChange(page: number) {
    this.page = page;
  }

  joinBooking(booking: any) {
    // TODO: Implement join logic
    alert('Joining session for ' + booking.mentor);
  }

  cancelBooking(booking: any) {
    // TODO: Implement cancel logic
    alert('Cancelling booking for ' + booking.mentor);
  }

  reviewBooking(booking: any) {
    // TODO: Implement review logic
    alert('Reviewing session for ' + booking.mentor);
  }

  bookingTabDate(booking: any): 'upcoming' | 'past' {
    // Check if booking has ended based on endDateTime
    if (booking.endDateTime) {
      const now = new Date();
      const endTime = new Date(booking.endDateTime);
      return endTime > now ? 'upcoming' : 'past';
    }
    // Fallback to checking startDateTime if no endDateTime
    const now = new Date();
    const start = new Date(booking.startDateTime);
    return start > now ? 'upcoming' : 'past';
  }

  getBookingStatus(booking: any): string {
    // If booking has ended, mark as completed
    if (booking.endDateTime) {
      const endTime = new Date(booking.endDateTime);
      const now = new Date();
      if (endTime <= now) {
        return 'Completed';
      }
    }
    return booking.status || 'Scheduled';
  }

  getBookingById(bookingId: number) {
    return this.http.get(`/api/Bookings/${bookingId}`);
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
    // Don't show the modal for sessions in the past
    if (this.isSessionInPast(booking)) {
      alert('Cannot cancel a session that has already started or passed.');
      return;
    }
    
    // Don't show the modal for non-pending sessions
    if (booking.status?.toLowerCase() !== 'pending') {
      alert('Only pending bookings can be cancelled.');
      return;
    }
    
    this.bookingToCancel = booking;
    this.showCancelModal = true;
    
    // Add body class to prevent scrolling
    document.body.classList.add('modal-open');
  }

  closeCancelModal() {
    this.showCancelModal = false;
    this.bookingToCancel = null;
    
    // Remove body class to allow scrolling
    document.body.classList.remove('modal-open');
  }

  confirmCancelBooking() {
    if (!this.bookingToCancel || !this.menteeId) return;
    
    const bookingId = this.bookingToCancel.bookingId || this.bookingToCancel.id;
    
    // Check if the session is in the past
    if (this.isSessionInPast(this.bookingToCancel)) {
      alert('Cannot cancel a session that has already started or passed.');
      this.closeCancelModal();
      return;
    }
    
    this.menteeBookingservice.cancelBooking(bookingId).subscribe({
      next: (response) => {
        console.log('Booking cancelled successfully:', response);
        
        // Update the local booking status
        const bookingIndex = this.allBookings.findIndex(b => 
          (b.bookingId || b.id) === bookingId
        );
        
        if (bookingIndex >= 0) {
          this.allBookings[bookingIndex].status = 'Cancelled';
          // Re-categorize bookings to update UI
          this.categorizeBookings();
          this.calculateStats();
        }
        
        this.closeCancelModal();
        alert('Booking cancelled successfully.');
      },
      error: (err) => {
        console.error('Error cancelling booking:', err);
        
        // Display a more specific error message if available
        if (err.error && typeof err.error === 'string') {
          alert(`Failed to cancel booking: ${err.error}`);
        } else {
          alert('Failed to cancel booking. Please try again later.');
        }
        
        this.closeCancelModal();
      }
    });
  }

  // Check if a session is in the past
  isSessionInPast(booking: any): boolean {
    if (!booking || !booking.startDateTime) return false;
    
    const sessionDate = new Date(booking.startDateTime);
    const now = new Date();
    
    // Ensure we're comparing in the same timezone (UTC)
    const nowUTC = new Date(Date.UTC(
      now.getUTCFullYear(), 
      now.getUTCMonth(), 
      now.getUTCDate(),
      now.getUTCHours(),
      now.getUTCMinutes()
    ));
    
    return sessionDate < nowUTC;
  }

  // Check if a booking is eligible for cancellation
  canCancelBooking(booking: any): boolean {
    if (!booking || !booking.status) return false;
    return booking.status.toLowerCase() === 'pending' && !this.isSessionInPast(booking);
  }

  private getAuthToken(): string {
    return document.cookie.split('; ').find(row => row.startsWith('authToken='))?.split('=')[1] || '';
  }

  // Apply sorting to bookings
  applySorting(bookings: any[]): any[] {
    if (!bookings || bookings.length === 0) return [];
    
    return [...bookings].sort((a, b) => {
      // Default to startDateTime if missing
      const dateA = new Date(a.startDateTime || a.startTime || new Date());
      const dateB = new Date(b.startDateTime || b.startTime || new Date());
      
      switch (this.sortBy) {
        case 'date-asc': // Oldest first
          return dateA.getTime() - dateB.getTime();
        case 'date-desc': // Newest first
          return dateB.getTime() - dateA.getTime();
        case 'price-asc': // Lowest price first
          return (a.totalAmount || 0) - (b.totalAmount || 0);
        case 'price-desc': // Highest price first
          return (b.totalAmount || 0) - (a.totalAmount || 0);
        default:
          return dateB.getTime() - dateA.getTime();
      }
    });
  }

  // Handle sort change
  changeSorting(sortOption: string) {
    this.sortBy = sortOption;
    this.filterAndSortBookings();
  }

  // Apply search filter
  applySearch(bookings: any[]): any[] {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      return bookings;
    }
    
    const searchLower = this.searchTerm.toLowerCase().trim();
    
    return bookings.filter(booking => {
      return (
        // Search by mentor name
        (booking.mentorName || '').toLowerCase().includes(searchLower) ||
        // Search by booking ID
        (booking.bookingId?.toString() || '').includes(searchLower) ||
        // Search by session type
        (booking.sessionType || '').toLowerCase().includes(searchLower) ||
        // Search by date
        this.formatDate(booking.startDateTime)?.toLowerCase().includes(searchLower) ||
        // Search by status
        (booking.status || '').toLowerCase().includes(searchLower)
      );
    });
  }

  // Handle search input change
  onSearchChange(event: any) {
    this.searchTerm = event.target.value;
    this.filterAndSortBookings();
    this.currentPage = 1; // Reset to first page when searching
  }

  // Clear search
  clearSearch() {
    this.searchTerm = '';
    this.filterAndSortBookings();
  }

  // Combined filter and sort function
  filterAndSortBookings() {
    // First filter by active tab
    let tabFilteredBookings: any[] = [];
    switch (this.activeTab) {
      case 'pending':
        tabFilteredBookings = this.pendingBookings;
        break;
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
        tabFilteredBookings = this.pendingBookings;
    }
    
    // Then apply search filter
    const searchFilteredBookings = this.applySearch(tabFilteredBookings);
    
    // Finally apply sorting
    this.filteredBookings = this.applySorting(searchFilteredBookings);
    
    // Update pagination
    this.totalItems = this.filteredBookings.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.updatePaginationInfo();
  }

  // Update pagination info based on filtered results
  updatePaginationInfo() {
    // Adjust current page if it's now out of bounds
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    } else if (this.totalPages === 0) {
      this.currentPage = 1;
    }
  }

  // Get appropriate empty state message based on filters
  getEmptyStateMessage(): string {
    if (this.searchTerm) {
      return `No results found for "${this.searchTerm}"`;
    }
    return `You don't have any ${this.activeTab} bookings at the moment.`;
  }

  // Get a user-friendly message about when the session can be joined
  getJoinTimeMessage(booking: any): string {
    if (!booking || !booking.startDateTime) return '';
    
    // Calculate time difference using UTC time to match the API
    const now = new Date();
    const startTime = new Date(booking.startDateTime);
    
    // Ensure we're comparing in the same timezone (UTC)
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
      // Session in future, but more than 5 minutes away
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
      // Session too far in past
      return '(session expired)';
    } else {
      // Should be able to join now
      return 'now';
    }
  }

  // Debug function to check booking properties
  debugBooking(booking: any): void {
    console.log('Booking ID:', booking.bookingId);
    console.log('Status:', booking.status);
    console.log('Status lowercase:', booking.status?.toLowerCase());
    console.log('Has Google Meet Link:', !!booking.googleMeetLink);
    console.log('Google Meet Link:', booking.googleMeetLink);
    console.log('Can Join Session:', this.canJoinSession(booking));
    console.log('Is Session In Past:', this.isSessionInPast(booking));
    
    // Calculate time conditions
    const now = new Date();
    const startTime = new Date(booking.startDateTime);
    
    // Ensure we're comparing in the same timezone (UTC)
    const nowUTC = new Date(Date.UTC(
      now.getUTCFullYear(), 
      now.getUTCMonth(), 
      now.getUTCDate(),
      now.getUTCHours(),
      now.getUTCMinutes()
    ));
    
    const timeDiff = startTime.getTime() - nowUTC.getTime();
    const minutesDiff = timeDiff / (1000 * 60);
    
    console.log('Minutes until session:', minutesDiff);
    console.log('Join window condition (needs to be within 5 min before start and 60 min after):', minutesDiff <= 5 && minutesDiff >= -60);
  }
}
