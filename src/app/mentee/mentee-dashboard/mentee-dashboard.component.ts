// mentee-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MenteeLayoutComponent } from '../mentee-layout.component';
import { MenteeService } from '../../Services/Mentee.service';
import { AuthService } from '../../Services/auth.service';
import { menteeBookingservice } from '../../Services/menteeBooking.service';

@Component({
  selector: 'app-mentee-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MenteeLayoutComponent],
  templateUrl: './mentee-dashboard.component.html',
  styleUrls: ['./mentee-dashboard.component.css']
})
export class MenteeDashboardComponent implements OnInit {
  menteeName: string = '';
  menteeId: number | null = null;
  stats = [
    { label: 'Total Sessions', value: 0, icon: 'bi-calendar-check' },
    { label: 'Upcoming', value: 0, icon: 'bi-clock-history' },
    { label: 'Completed', value: 0, icon: 'bi-check-circle' },
    { label: 'Cancelled', value: 0, icon: 'bi-x-circle' }
  ];
  upcomingSessions: any[] = [];
  completedSessions: any[] = [];
  recentActivity: any[] = [];

  constructor(
    private menteeService: MenteeService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private menteeBookingservice: menteeBookingservice
  ) {}

  ngOnInit() {
    // Get menteeId from AuthService (currentUserValue)
    const user = this.authService.currentUserValue;
    this.menteeId = user && user.userId ? user.userId : null;
    if (!this.menteeId) {
      console.error('No valid menteeId found. Please log in again.');
      // Optionally redirect to login
      // this.router.navigate(['/login']);
      return;
    }
    this.loadDashboardData(this.menteeId);
  }

  loadDashboardData(menteeId: number) {
    // Use the dashboard endpoint for stats and recent activity
    this.menteeService.getDashboardData(menteeId).subscribe({
      next: (data: any) => {
        this.menteeName = data.menteeName;
        this.stats[0].value = data.stats.totalSessions;
        this.stats[1].value = data.stats.upcomingSessions;
        this.stats[2].value = data.stats.completedSessions;
        this.stats[3].value = data.stats.cancelledSessions;
        this.recentActivity = (data.recentActivities || []).map((activity: any) => ({
          type: activity.activityType,
          text: activity.text,
          date: new Date(activity.activityDate).toLocaleDateString()
        }));
      },
      error: (err: any) => {
        console.error('Failed to load dashboard data', err);
        this.menteeName = '';
        this.stats.forEach(s => s.value = 0);
        this.recentActivity = [];
      }
    });
    // Fetch upcoming sessions from /api/MenteeBookings/mentee/{menteeId}/upcoming
    this.menteeBookingservice.getUpcomingBookings(menteeId).subscribe({
      next: (sessions: any[]) => {
        this.upcomingSessions = (sessions || []).map(session => ({
          id: session.bookingId,
          mentor: session.mentorName,
          date: session.startDateTime ? new Date(session.startDateTime).toLocaleDateString() : '',
          time: session.startDateTime ? new Date(session.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          joinUrl: session.googleMeetLink,
          status: session.status
        }));
      },
      error: () => {
        this.upcomingSessions = [];
      }
    });
    // Fetch completed sessions from /api/MenteeBookings/mentee/{menteeId}/completed
    this.menteeBookingservice.getCompletedBookings(menteeId).subscribe({
      next: (sessions: any[]) => {
        this.completedSessions = (sessions || []).map(session => ({
          id: session.bookingId,
          mentor: session.mentorName,
          date: session.startDateTime ? new Date(session.startDateTime).toLocaleDateString() : '',
          time: session.startDateTime ? new Date(session.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          status: session.status
        }));
      },
      error: () => {
        this.completedSessions = [];
      }
    });
  }

  updateTotalSessions() {
    this.stats[0].value = this.stats[1].value + this.stats[2].value;
  }
}