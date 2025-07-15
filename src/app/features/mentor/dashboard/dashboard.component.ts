import { Component, OnInit } from '@angular/core';
import { MentorService } from '../../../Services/mentor.service';
import { AuthService } from '../../../Services/auth.service';
import { MentorBooking } from '../../../Models/Mentor/MentorBooking';
import { MentorEarnings } from '../../../Models/Mentor/MentorEarnings';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MentorReviewsComponent } from '../mentor-reviews/mentor-reviews.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  standalone: true,
  imports: [CommonModule, RouterLink, MentorReviewsComponent]
})
export class DashboardComponent implements OnInit {
  mentorId: number = 0;
  todaySessions: MentorBooking[] = [];
  upcomingSessions: MentorBooking[] = [];
  earnings: MentorEarnings | null = null;
  isAvailable: boolean = true;
  isLoading: boolean = true;
  error: string | null = null;
  nextUpToday: MentorBooking[] = [];

  // Add pagination properties
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 0;
  paginatedTodaySessions: MentorBooking[] = [];

  constructor(
    private mentorService: MentorService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Get current user ID from auth service
    this.mentorId = this.authService.currentUserValue?.userId || 0;
    
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    let pendingSessionsCount = 0;

    // Load earnings data first
    this.mentorService.getMentorEarnings().subscribe({
      next: (earnings) => {
        this.earnings = earnings;
        console.log('Earnings data received:', earnings);
        
        // Add calculated pending sessions to earnings
        this.earnings.pendingSessions = pendingSessionsCount;
      },
      error: (error) => {
        console.error('Error loading earnings data:', error);
      }
    });

    // Load today's sessions
    this.mentorService.getTodaySessions(this.mentorId).subscribe({
      next: (sessions) => {
        this.todaySessions = sessions;
        console.log('Today sessions data:', sessions);
        
        // Calculate pending sessions count
        pendingSessionsCount = sessions.filter(session => 
          session.status === 'Pending' || session.status === 'Confirmed'
        ).length;
        
        // Update earnings with calculated pending sessions
        if (this.earnings) {
          this.earnings.pendingSessions = pendingSessionsCount;
        }
        
        // Update pagination
        this.updatePagination();
        
        // Compute next up for today
        this.updateNextUpToday();
        
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Failed to load today\'s sessions';
        this.isLoading = false;
        console.error('Error loading today\'s sessions:', error);
      }
    });

    // Load upcoming sessions
    this.mentorService.getUpcomingBookings(this.mentorId).subscribe({
      next: (sessions) => {
        this.upcomingSessions = sessions.slice(0, 5);
      },
      error: (error) => {
        console.error('Error loading upcoming sessions:', error);
      }
    });
  }

  updateNextUpToday(): void {
    const now = new Date();
    this.nextUpToday = this.todaySessions
      .filter(session => {
        const sessionStart = new Date(session.startDateTime);
        return (
          sessionStart > now &&
          session.status !== 'Cancelled' &&
          session.paymentStatus === 'Paid'
        );
      })
      .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())
      .slice(0, 2);
  }

  toggleAvailability(): void {
    this.isAvailable = !this.isAvailable;
    this.mentorService.updateMentorStatus(this.isAvailable).subscribe({
      next: () => {
        // Status updated successfully
      },
      error: (error) => {
        // Revert the toggle if the API call fails
        this.isAvailable = !this.isAvailable;
        console.error('Error updating availability status:', error);
      }
    });
  }

  joinSession(bookingId: number, googleMeetLink?: string): void {
    console.log('Join session clicked for booking:', bookingId, 'with link:', googleMeetLink);
    
    // Always try to join, even if googleMeetLink is null
    // The API will generate the link when we call the join endpoint
    
    // Update status to InProgress when joining
    const todayIndex = this.todaySessions.findIndex(s => s.bookingId === bookingId);
    if (todayIndex !== -1) {
      this.todaySessions[todayIndex].status = 'InProgress';
    }
    
    const upcomingIndex = this.upcomingSessions.findIndex(s => s.bookingId === bookingId);
    if (upcomingIndex !== -1) {
      this.upcomingSessions[upcomingIndex].status = 'InProgress';
    }
    
    // If we have a Google Meet link, open it
    if (googleMeetLink) {
      window.open(googleMeetLink, '_blank');
    } else {
      // Call the API to get/generate the Google Meet link
      console.log('No Google Meet link available, would call API to generate one');
      // You could call your booking service here to join the session
      // this.mentorBookingService.joinBooking(bookingId).subscribe(...)
    }
  }

  // Replace the canJoinSession method with proper business logic
  canJoinSession(session: MentorBooking): boolean {
    // Must have meeting link
    if (!session.googleMeetLink) {
      return false;
    }
    
    const now = new Date();
    const sessionStart = new Date(session.startDateTime);
    const sessionEnd = new Date(session.endDateTime);
    
    // Calculate time differences in minutes
    const minutesUntilStart = (sessionStart.getTime() - now.getTime()) / (1000 * 60);
    const minutesSinceEnd = (now.getTime() - sessionEnd.getTime()) / (1000 * 60);
    
    // Business Rules:
    
    // 1. Must be paid session
    if (session.paymentStatus !== 'Paid') {
      return false;
    }
    
    // 2. Status must be Confirmed or InProgress
    if (session.status !== 'Confirmed' && session.status !== 'InProgress') {
      return false;
    }
    
    // 3. Time-based rules - can join 15 minutes before to 30 minutes after end
    const canJoinByTime = 
      (minutesUntilStart <= 15 && minutesUntilStart > -30) || // 15 min before to 30 min after start
      (session.status === 'InProgress' && minutesSinceEnd <= 30); // In progress sessions up to 30 min after end
    
    return canJoinByTime;
  }

  // Add method to show different button states
  getSessionButtonState(session: MentorBooking): {type: string, label: string, class: string, enabled: boolean} {
    const now = new Date();
    const sessionStart = new Date(session.startDateTime);
    const minutesUntilStart = (sessionStart.getTime() - now.getTime()) / (1000 * 60);
    
    // No meeting link set
    if (!session.googleMeetLink) {
      return {
        type: 'no-link',
        label: 'Set Meeting Link',
        class: 'btn-warning',
        enabled: false
      };
    }
    
    // Payment not completed
    if (session.paymentStatus !== 'Paid') {
      return {
        type: 'payment',
        label: 'Payment Required',
        class: 'btn-secondary',
        enabled: false
      };
    }
    
    // Session completed
    if (session.status === 'Completed') {
      return {
        type: 'completed',
        label: 'Completed',
        class: 'btn-secondary',
        enabled: false
      };
    }
    
    // Can join now
    if (this.canJoinSession(session)) {
      return {
        type: 'join',
        label: session.status === 'InProgress' ? 'Rejoin Session' : 'Join Session',
        class: 'btn-primary',
        enabled: true
      };
    }
    
    // Too early to join
    if (minutesUntilStart > 15) {
      return {
        type: 'early',
        label: `Available in ${Math.ceil(minutesUntilStart - 15)} min`,
        class: 'btn-secondary',
        enabled: false
      };
    }
    
    // Default state
    return {
      type: 'default',
      label: 'Not Available',
      class: 'btn-secondary',
      enabled: false
    };
  }

  debugCanJoin(session: MentorBooking): void {
    console.log('Debug session:', {
      bookingId: session.bookingId,
      status: session.status,
      googleMeetLink: session.googleMeetLink,
      canJoin: this.canJoinSession(session)
    });
  }

  markComplete(session: MentorBooking): void {
    // You can call your booking service to mark as complete
    // Or navigate to the full bookings page
    console.log('Marking session as complete:', session.bookingId);
    
    // Update the session status locally for immediate feedback
    const index = this.todaySessions.findIndex(s => s.bookingId === session.bookingId);
    if (index !== -1) {
      this.todaySessions[index].status = 'Completed';
    }
    
    const upcomingIndex = this.upcomingSessions.findIndex(s => s.bookingId === session.bookingId);
    if (upcomingIndex !== -1) {
      this.upcomingSessions[upcomingIndex].status = 'Completed';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'badge bg-success';
      case 'confirmed':
        return 'badge bg-primary';
      case 'pending':
        return 'badge bg-warning';
      case 'cancelled':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }

  // Add this method to your component for testing
  testData(): void {
    console.log('=== EARNINGS DEBUG ===');
    console.log('Current earnings object:', this.earnings);
    console.log('Earnings keys:', this.earnings ? Object.keys(this.earnings) : 'No earnings object');
    console.log('Pending sessions value:', this.earnings?.pendingSessions); // Updated property name
    console.log('Type of pending sessions:', typeof this.earnings?.pendingSessions);
    
    // Check all available properties
    if (this.earnings) {
      console.log('All earnings properties:');
      console.log('  totalEarnings:', this.earnings.totalEarnings);
      console.log('  thisMonthEarnings:', this.earnings.thisMonthEarnings);
      console.log('  lastMonthEarnings:', this.earnings.lastMonthEarnings);
      console.log('  completedSessions:', this.earnings.completedSessions);
      console.log('  upcomingSessions:', this.earnings.upcomingSessions);
      console.log('  pendingSessions:', (this.earnings as any).pendingSessions);
    }
    
    console.log('=== END DEBUG ===');
  }

  // Add these methods to your DashboardComponent

  updatePagination(): void {
    this.totalPages = Math.ceil(this.todaySessions.length / this.itemsPerPage);
    
    // Ensure current page is valid
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
    
    // Calculate start and end indices
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    
    // Get paginated sessions
    this.paginatedTodaySessions = this.todaySessions.slice(startIndex, endIndex);
    
    console.log(`Pagination: Page ${this.currentPage}/${this.totalPages}, Items: ${this.paginatedTodaySessions.length}`);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      // Show all pages
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page, current page range, and last page
      const currentPage = this.currentPage;
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(this.totalPages, currentPage + 2);
      
      // Always show first page
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) {
          pages.push(-1); // -1 represents "..."
        }
      }
      
      // Show current range
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Always show last page
      if (endPage < this.totalPages) {
        if (endPage < this.totalPages - 1) {
          pages.push(-1); // -1 represents "..."
        }
        pages.push(this.totalPages);
      }
    }
    
    return pages;
  }

  trackByBookingId(index: number, session: MentorBooking): number {
    return session.bookingId;
  }
}