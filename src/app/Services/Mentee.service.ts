// mentee.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment.development';

export interface MentorCard {
  id?: number;
  userId: number;
  fullName: string;
  email: string;
  role?: string | null;
  profilePicture: string | null;
  bio: string | null;
  hourlyRate: number;
  mentorSkills?: { id: number; name: string; mentorsCount: number }[];
  skills: { Name: string; id: number }[]; // Skills formatted for display
  skillsArray?: string[]; // Original skills array from backend
  availabilities: any[];
  rating?: number | null;
  isMentor?: boolean;
  isInterviewer?: boolean;
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
  private apiUrl = `${environment.apiUrl}/mentee`;

  constructor(private http: HttpClient) { }

  getDashboardData(menteeId: number): Observable<MenteeDashboard> {
    return this.http.get<MenteeDashboard>(`${this.apiUrl}/${menteeId}/dashboard`);
  }

  getAllMentors(): Observable<MentorCard[]> {
    return this.http.get<MentorCard[]>(`${environment.apiUrl}/mentors/all`);
  }
}