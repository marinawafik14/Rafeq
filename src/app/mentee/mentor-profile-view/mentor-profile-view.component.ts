import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenteeLayoutComponent } from '../mentee-layout.component';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ReviewService, MentorReview } from '../../Services/review.service';

@Component({
  selector: 'app-mentor-profile-view',
  standalone: true,
  imports: [CommonModule, MenteeLayoutComponent],
  templateUrl: './mentor-profile-view.component.html',
  styleUrls: ['./mentor-profile-view.component.css']
})
export class MentorProfileViewComponent implements OnInit {
  mentor: any = null;
  mentorId: number | null = null;
  menteeId: number | null = null;
  reviews: MentorReview[] = [];
  loading = true;

  // Additional properties for enhanced UI
  showAllReviews = false;
  showAllSkills = false;
  reviewsPerPage = 3;
  isFavorite = false;

  constructor(
    private route: ActivatedRoute, 
    private http: HttpClient, 
    public router: Router,
    private reviewService: ReviewService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      // Get menteeId from route
      const menteeId = params.get('menteeId');
      this.menteeId = menteeId ? +menteeId : null;
      
      // If no menteeId in route, try to get it from auth token
      if (!this.menteeId) {
        const token = document.cookie.split('; ').find(row => row.startsWith('authToken='))?.split('=')[1];
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            this.menteeId = payload.menteeId || payload.userId || null;
          } catch (e) {
            console.error('Failed to parse token:', e);
          }
        }
      }
      
      // Get mentorId from route
      const mentorId = params.get('id');
      if (mentorId) {
        this.mentorId = +mentorId;
        this.loadMentorData();
      }
    });
  }

  private loadMentorData() {
    if (!this.mentorId) return;

    this.loading = true;
    
    // Load mentor profile first
    this.http.get(`https://localhost:7001/api/mentors/${this.mentorId}`).subscribe({
      next: (mentorData) => {
        this.mentor = mentorData;
        console.log('Mentor data loaded:', this.mentor);
        
        // Then load reviews separately
        this.reviewService.getMentorReviews(this.mentorId!).subscribe({
          next: (reviews) => {
            this.reviews = reviews;
            console.log('Reviews loaded:', this.reviews);
            this.loading = false;
          },
          error: (reviewError) => {
            console.warn('Failed to load reviews (this is OK):', reviewError);
            this.reviews = []; // Set empty array if reviews fail
            this.loading = false;
          }
        });
      },
      error: (err) => {
        console.error('Error loading mentor data:', err);
        this.loading = false;
        this.mentor = null;
        this.reviews = [];
      }
    });
  }

  hasAvailability(): boolean {
    return this.mentor?.availabilities && this.mentor.availabilities.length > 0;
  }

  getGroupedAvailabilities(): any[] {
    if (!this.mentor?.availabilities) return [];
    
    const grouped = new Map();
    
    this.mentor.availabilities.forEach((availability: any) => {
      const dayName = availability.dayName;
      const timeSlot = this.formatTimeRange(availability.startTime, availability.endTime);
      
      if (grouped.has(dayName)) {
        grouped.get(dayName).push(timeSlot);
      } else {
        grouped.set(dayName, [timeSlot]);
      }
    });
    
    return Array.from(grouped.entries()).map(([dayName, timeSlots]) => ({
      dayName,
      timeSlots
    }));
  }

  private formatTimeRange(startTime: string, endTime: string): string {
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    };
    
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  }

  // Image error handler
  onImageError(event: any) {
    event.target.src = '/images/default-avatar.png';
  }

  // Get mentor skills
  getMentorSkills(): string[] {
    if (this.mentor?.mentorSkills) {
      return this.mentor.mentorSkills.map((skill: any) => 
        typeof skill === 'string' ? skill : skill.name || skill.skillName
      );
    }
    return this.mentor?.skills || [];
  }

  // Calculate average rating
  getAverageRating(): number {
    if (!this.reviews || this.reviews.length === 0) return 0;
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    return Math.round((sum / this.reviews.length) * 10) / 10;
  }

  // Get star array for rating display
  getStarArray(rating: number): boolean[] {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= Math.floor(rating));
    }
    return stars;
  }

  // Format review date
  formatReviewDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  // Get displayed reviews based on showAllReviews flag
  getDisplayedReviews(): MentorReview[] {
    if (this.showAllReviews) {
      return this.reviews;
    }
    return this.reviews.slice(0, this.reviewsPerPage);
  }

  // Get experience years (placeholder - can be calculated from mentor data)
  getExperienceYears(): string {
    // This would be calculated from mentor's experience data
    return this.mentor?.experienceYears || '5+';
  }

  // Get sessions count (placeholder)
  getSessionsCount(): string {
    return this.mentor?.sessionsCompleted || '50+';
  }

  // Get response time (placeholder)
  getResponseTime(): string {
    return this.mentor?.responseTime || '< 2h';
  }

  // Toggle favorite status
  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
    // Here you would typically call an API to save the favorite status
  }

  // TrackBy functions for performance
  trackByReview(index: number, review: MentorReview): number {
    return review.id;
  }

  trackByAvailability(index: number, availability: any): string {
    return availability.dayName;
  }

  trackByTimeSlot(index: number, timeSlot: string): string {
    return timeSlot;
  }

  bookSession() {
    if (this.mentorId && this.hasAvailability()) {
      if (this.menteeId) {
        // Navigate directly to the booking-form with menteeId
        const navigationPath = ['/mentee', this.menteeId, 'booking-form'];
        console.log('Navigating to booking form:', navigationPath); // Debug log
        
        this.router.navigate(navigationPath, { 
          queryParams: { 
            mentorId: this.mentorId,
            mentorName: this.mentor?.fullName,
            hourlyRate: this.mentor?.hourlyRate
          } 
        });
      } else {
        console.error('No menteeId available for navigation');
        // Show an error message to the user instead of redirecting to login
        alert('Unable to book session. Please log in again.');
        this.router.navigate(['/login']);
      }
    } else {
      console.log('Cannot book session:', {
        mentorId: this.mentorId,
        hasAvailability: this.hasAvailability(),
        mentor: this.mentor
      });
    }
  }
}
