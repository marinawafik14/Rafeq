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

  joinSession(bookingId: number, googleMeetLink: string): void {
    // Open Google Meet link in a new tab
    if (googleMeetLink) {
      window.open(googleMeetLink, '_blank');
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
