import { Component, OnInit } from '@angular/core';
import { MentorService } from '../../../Services/mentor.service';
import { AuthService } from '../../../Services/auth.service';
import { MentorBooking } from '../../../Models/Mentor/MentorBooking';
import { MentorEarnings } from '../../../Models/Mentor/MentorEarnings';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  standalone: true,
  imports: [CommonModule, RouterLink]
})
export class DashboardComponent implements OnInit {
  mentorId: number = 0;
  todaySessions: MentorBooking[] = [];
  upcomingSessions: MentorBooking[] = [];
  earnings: MentorEarnings | null = null;
  isAvailable: boolean = true;
  isLoading: boolean = true;
  error: string | null = null;

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

    // Load earnings data first
    this.mentorService.getMentorEarnings().subscribe({
      next: (earnings) => {
        this.earnings = earnings;
      },
      error: (error) => {
        console.error('Error loading earnings data:', error);
      }
    });

    // Load today's sessions
    this.mentorService.getTodaySessions(this.mentorId).subscribe({
      next: (sessions) => {
        this.todaySessions = sessions;
        // Add this debug line
        console.log('Today sessions data:', sessions);
        sessions.forEach(session => {
          console.log(`Session ${session.bookingId}: status=${session.status}, googleMeetLink=${session.googleMeetLink}`);
        });
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
        this.upcomingSessions = sessions.slice(0, 5); // Only get the first 5 upcoming sessions
      },
      error: (error) => {
        console.error('Error loading upcoming sessions:', error);
      }
    });
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
    
    // 3. Time-based rules
    const canJoinByTime = 
      (minutesUntilStart <= 15 && minutesUntilStart > -30) || // 15 min before to 30 min after start
      (session.status === 'InProgress' && minutesSinceEnd <= 30); // In progress sessions up to 30 min after end
    
    console.log(`Session ${session.bookingId}: 
      - Status: ${session.status}
      - Payment: ${session.paymentStatus}
      - Minutes until start: ${minutesUntilStart.toFixed(1)}
      - Minutes since end: ${minutesSinceEnd.toFixed(1)}
      - Can join: ${canJoinByTime}`);
    
    return canJoinByTime;
  }

  // Add method to show different button states
  getSessionButtonState(session: MentorBooking): {type: string, label: string, class: string, enabled: boolean} {
    const now = new Date();
    const sessionStart = new Date(session.startDateTime);
    const minutesUntilStart = (sessionStart.getTime() - now.getTime()) / (1000 * 60);
    
    // Payment not made
    if (session.paymentStatus !== 'Paid') {
      return {
        type: 'payment',
        label: 'Payment Required',
        class: 'btn-warning',
        enabled: false
      };
    }
    
    // Session not confirmed yet
    if (session.status === 'Pending') {
      return {
        type: 'pending',
        label: 'Awaiting Confirmation',
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
        class: 'btn-outline-primary',
        enabled: false
      };
    }
    
    // Session ended
    if (session.status === 'Completed') {
      return {
        type: 'completed',
        label: 'Session Completed',
        class: 'btn-success',
        enabled: false
      };
    }
    
    // Default - session ended or cancelled
    return {
      type: 'ended',
      label: 'Session Ended',
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
}