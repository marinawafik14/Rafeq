// mentee-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MenteeLayoutComponent } from '../mentee-layout.component';
import { MenteeService } from '../../Services/Mentee.service';
import { AuthService } from '../../Services/auth.service';
import { BookingService } from '../../Services/booking.service';

@Component({
  selector: 'app-mentee-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MenteeLayoutComponent],
  templateUrl: './mentee-dashboard.component.html',
  styleUrls: ['./mentee-dashboard.component.css']
})
export class MenteeDashboardComponent implements OnInit {
  menteeName: string = '';
  menteeId: number = 2;
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
    private bookingService: BookingService
  ) {}

  ngOnInit() {
    // Try to get menteeId from route param, then from token, else fallback
    this.route.paramMap.subscribe(params => {
      const routeId = params.get('menteeId');
      let menteeId: number | null = routeId ? +routeId : null;
      if (!menteeId || isNaN(menteeId)) {
        menteeId = this.getMenteeIdFromToken();
      }
      if (!menteeId || isNaN(menteeId)) {
        // Optionally, redirect to login or show error
        console.error('No valid menteeId found. Please log in again.');
        return;
      }
      this.menteeId = menteeId;
      this.loadDashboardData(this.menteeId);
    });
  }

  loadDashboardData(menteeId: number) {
    // Fetch stats from menteeService as before
    this.menteeService.getDashboardData(menteeId).subscribe({
      next: (data: any) => {
        this.menteeName = data.menteeName;
        // We'll update stats after both bookings API calls complete
        this.recentActivity = data.recentActivities.map((activity: any) => ({
          type: activity.activityType,
          text: activity.text,
          date: new Date(activity.activityDate).toLocaleDateString()
        }));
      },
      error: (err: any) => {
        console.error('Failed to load dashboard data', err);
      }
    });
    // Fetch upcoming and completed sessions from BookingService endpoints
    this.bookingService.getUpcomingBookings(menteeId).subscribe({
      next: (sessions: any[]) => {
        this.upcomingSessions = sessions.map(session => ({
          id: session.bookingId,
          mentor: session.mentorName,
          date: new Date(session.startDateTime).toLocaleDateString(),
          time: new Date(session.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          joinUrl: session.googleMeetLink,
          status: session.status
        }));
        this.stats[1].value = this.upcomingSessions.length;
        this.updateTotalSessions();
      },
      error: err => {
        this.upcomingSessions = [];
        this.stats[1].value = 0;
        this.updateTotalSessions();
      }
    });
    this.bookingService.getCompletedBookings(menteeId).subscribe({
      next: (sessions: any[]) => {
        this.completedSessions = sessions.map(session => ({
          id: session.bookingId,
          mentor: session.mentorName,
          date: new Date(session.startDateTime).toLocaleDateString(),
          time: new Date(session.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          joinUrl: session.googleMeetLink,
          status: session.status
        }));
        this.stats[2].value = this.completedSessions.length;
        this.updateTotalSessions();
      },
      error: err => {
        this.completedSessions = [];
        this.stats[2].value = 0;
        this.updateTotalSessions();
      }
    });
  }

  updateTotalSessions() {
    this.stats[0].value = this.stats[1].value + this.stats[2].value;
  }

  getMenteeIdFromToken(): number | null {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('authToken='))
      ?.split('=')[1];
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.menteeId || null;
    } catch (e) {
      return null;
    }
  }
}