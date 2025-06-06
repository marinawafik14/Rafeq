// mentee.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MentorCard {
  userId: number;
  fullName: string;
  email: string;
  profilePicture: string | null;
  bio: string | null;
  hourlyRate: number;
  skills: { Name: string }[];
  availabilities: any[];
  rating?: number | null; // Added for mentor rating
}

export interface MenteeDashboard {
  menteeName: string;
  stats: {
    totalSessions: number;
    upcomingSessions: number;
    completedSessions: number;
    cancelledSessions: number;
  };
  upcomingSessions: Array<{
    bookingId: number;
    mentorName: string;
    sessionDate: string;
    sessionTime: string;
    joinUrl: string;
    status: string;
  }>;
  recentActivities: Array<{
    activityType: string;
    text: string;
    activityDate: string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class MenteeService {
  private apiUrl = 'https://localhost:7001/api/mentee';

  constructor(private http: HttpClient) { }

  getDashboardData(menteeId: number): Observable<MenteeDashboard> {
    return this.http.get<MenteeDashboard>(`https://localhost:7001/api/mentee/${menteeId}/dashboard`);
  }

  getAllMentors(): Observable<MentorCard[]> {
    return this.http.get<MentorCard[]>('https://localhost:7001/api/mentors/all');
  }
}