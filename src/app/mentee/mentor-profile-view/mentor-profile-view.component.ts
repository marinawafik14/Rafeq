import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenteeLayoutComponent } from '../mentee-layout.component';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../Services/auth.service';
import { environment } from '../../environments/environment.development';
@Component({
  selector: 'app-mentor-profile-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mentor-profile-view.component.html',
  styleUrls: ['./mentor-profile-view.component.css']
})
export class MentorProfileViewComponent implements OnInit {
  mentor: any = null;
  mentorId: number | null = null;
  menteeId: number | null = null;
  reviews: any[] = [];
  loading = true;
  
  freeSlots: any[] = [];
  loadingSlots = false;
  private cachedGroupedSlots: any[] | null = null;

  showAllReviews = false;
  showAllSkills = false;
  reviewsPerPage = 3;
  isFavorite = false;

  showCreateReviewModal = false;
  showEditReviewModal = false;
  editingReview: any = null;
  menteeBookings: any[] = [];
  selectedBookingForReview: any = null;
  newReview = {
    reviewerId: 0,
    reviewedUserId: 0,
    bookingId: 0,
    rating: 5,
    comment: ''
  };

  showToastNotification = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' = 'success';

  showDeleteConfirmModal = false;
  pendingDeleteReviewId: number | null = null;
  reviewToDeleteId: number | null = null;

  currentAvailabilityPage = 0;
  availabilityPerPage = 2;
  showAllAvailability = false;

  constructor(
    private route: ActivatedRoute, 
    private http: HttpClient, 
    public router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.menteeId = this.authService.getCurrentUserId();
      
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
    
    this.http.get(`${environment.apiUrl}/mentors/${this.mentorId}`).subscribe({
      next: (mentorData) => {
        this.mentor = mentorData;
        
        this.loadFreeSlots();
        this.loadMentorReviews();
        
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.mentor = null;
        this.reviews = [];
      }
    });
  }

  private loadMentorReviews() {
    if (!this.mentorId) return;

    this.http.get<any[]>(`${environment.apiUrl}/mentee-reviews/mentor/${this.mentorId}`).subscribe({
      next: async (reviews) => {
        this.reviews = reviews;
        this.reviews.forEach((review) => {
          if (review.reviewerId && !review.menteeName) {
            review.menteeName = `Mentee #${review.reviewerId}`;
          } else if (!review.menteeName) {
            review.menteeName = 'Anonymous';
          }
        });
      },
      error: (reviewError) => {
        this.reviews = [];
      }
    });
  }

  private loadFreeSlots() {
    if (!this.mentorId) return;

    this.loadingSlots = true;
    this.http.get<any[]>(`${environment.apiUrl}/mentors/mentors/${this.mentorId}/free-slots`).subscribe({
      next: (slots) => {
        const availableSlots = slots.filter(slot => {
          if (slot.status === 'pending_payment') {
            return false;
          }
          
          const startTime = new Date(slot.start);
          const endTime = new Date(slot.end);
          const timeRange = slot.formatted.split('•')[1]?.trim() || slot.formatted;
          
          if (endTime <= startTime && this.isCrossMidnightTimeRange(timeRange)) {
            return false;
          }
          
          return true;
        });
        
        this.freeSlots = this.filterFutureSlots(availableSlots);
        this.cachedGroupedSlots = null;
        this.loadingSlots = false;
      },
      error: (err) => {
        this.freeSlots = [];
        this.cachedGroupedSlots = null;
        this.loadingSlots = false;
      }
    });
  }

  private filterFutureSlots(slots: any[]): any[] {
    const now = new Date();
    return slots.filter(slot => {
      const slotStart = new Date(slot.start);
      return slotStart > now;
    });
  }

  private isCrossMidnightTimeRange(timeRange: string): boolean {
    try {
      const [startStr, endStr] = timeRange.split(' - ');
      if (!startStr || !endStr) return false;

      const startPeriod = startStr.trim().split(' ')[1]?.toUpperCase();
      const endPeriod = endStr.trim().split(' ')[1]?.toUpperCase();
      
      return startPeriod === 'PM' && endPeriod === 'AM';
    } catch (error) {
      return false;
    }
  }

  hasAvailability(): boolean {
    return this.freeSlots && this.freeSlots.length > 0;
  }

  getGroupedFreeSlots(): any[] {
    if (!this.freeSlots || this.freeSlots.length === 0) return [];
    const now = new Date();
    const dateGroups = new Map<string, any>();
    this.freeSlots.forEach(slot => {
      const slotStart = new Date(slot.start);
      if (slotStart <= now) return; // skip past slots
      const slotDate = slotStart.toISOString().slice(0, 10);
      if (!dateGroups.has(slotDate)) {
        const date = new Date(slotDate);
        dateGroups.set(slotDate, {
          date: date,
          dayName: date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'short', 
            day: 'numeric' 
          }),
          slots: []
        });
      }
      const timeRange = slot.formatted.split('•')[1]?.trim() || slot.formatted;
      const group = dateGroups.get(slotDate);
      if (!group.slots.some((s: any) => s.timeRange === timeRange)) {
        group.slots.push({
          timeRange: timeRange,
          start: slot.start,
          end: slot.end,
          formatted: slot.formatted
        });
      }
    });
    const allGroupedSlots = Array.from(dateGroups.values()).sort((a, b) => 
      a.date.getTime() - b.date.getTime()
    );
    if (!this.showAllAvailability) {
      const startIndex = this.currentAvailabilityPage * this.availabilityPerPage;
      return allGroupedSlots.slice(startIndex, startIndex + this.availabilityPerPage);
    }
    return allGroupedSlots;
  }

  getAllGroupedFreeSlots(): any[] {
    if (!this.freeSlots || this.freeSlots.length === 0) return [];
    
    if (this.cachedGroupedSlots !== null) {
      return this.cachedGroupedSlots;
    }
    
    const dateGroups = new Map<string, any>();
    
    this.freeSlots.forEach(slot => {
      const slotDate = new Date(slot.start).toISOString().slice(0, 10);
      
      if (!dateGroups.has(slotDate)) {
        const date = new Date(slotDate);
        dateGroups.set(slotDate, {
          date: date,
          dayName: date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'short', 
            day: 'numeric' 
          }),
          slots: []
        });
      }
      
      const timeRange = slot.formatted.split('•')[1]?.trim() || slot.formatted;
      const group = dateGroups.get(slotDate);
      
      if (!group.slots.some((s: any) => s.timeRange === timeRange)) {
        group.slots.push({
          timeRange: timeRange,
          start: slot.start,
          end: slot.end,
          formatted: slot.formatted
        });
      }
    });

    this.cachedGroupedSlots = Array.from(dateGroups.values()).sort((a, b) => 
      a.date.getTime() - b.date.getTime()
    );
    
    return this.cachedGroupedSlots;
  }

  formatTimeRange(startTime: string, endTime: string): string {
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    const correctedStart = new Date(start.getTime() - (3 * 60 * 60 * 1000));
    const correctedEnd = new Date(end.getTime() - (3 * 60 * 60 * 1000));
    
    const startFormatted = correctedStart.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    const endFormatted = correctedEnd.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    return `${startFormatted} - ${endFormatted}`;
  }

  getGroupedAvailabilities(): any[] {
    return this.getGroupedFreeSlots();
  }

  canShowNextAvailability(): boolean {
    const allSlots = this.getAllGroupedFreeSlots();
    return (this.currentAvailabilityPage + 1) * this.availabilityPerPage < allSlots.length;
  }

  canShowPreviousAvailability(): boolean {
    return this.currentAvailabilityPage > 0;
  }

  nextAvailabilityPage(): void {
    if (this.canShowNextAvailability()) {
      this.currentAvailabilityPage++;
    }
  }

  previousAvailabilityPage(): void {
    if (this.canShowPreviousAvailability()) {
      this.currentAvailabilityPage--;
    }
  }

  toggleShowAllAvailability(): void {
    this.showAllAvailability = !this.showAllAvailability;
    if (!this.showAllAvailability) {
      this.currentAvailabilityPage = 0;
    }
  }

  getTotalAvailabilityPages(): number {
    const allSlots = this.getAllGroupedFreeSlots();
    return Math.ceil(allSlots.length / this.availabilityPerPage);
  }

  getCurrentAvailabilityPageInfo(): string {
    const allSlots = this.getAllGroupedFreeSlots();
    if (allSlots.length === 0) return '';
    
    const startIndex = this.currentAvailabilityPage * this.availabilityPerPage + 1;
    const endIndex = Math.min((this.currentAvailabilityPage + 1) * this.availabilityPerPage, allSlots.length);
    
    return `${startIndex}-${endIndex} of ${allSlots.length}`;
  }

  onImageError(event: any) {
    event.target.src = '/images/default-avatar.png';
  }

  getMentorSkills(): string[] {
    if (this.mentor?.mentorSkills) {
      return this.mentor.mentorSkills.map((skill: any) => 
        typeof skill === 'string' ? skill : skill.name || skill.skillName
      );
    }
    return this.mentor?.skills || [];
  }

  getAverageRating(): number {
    if (!this.reviews || this.reviews.length === 0) return 0;
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    return Math.round((sum / this.reviews.length) * 10) / 10;
  }

  getStarArray(rating: number): boolean[] {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= Math.floor(rating));
    }
    return stars;
  }

  loadMenteeBookings() {
    if (!this.menteeId) return;
    
    this.http.get<any[]>(`${environment.apiUrl}/MenteeBookings/mentee/${this.menteeId}/all`).subscribe({
      next: (bookings) => {
        this.menteeBookings = bookings.filter(booking => {
          const mentorMatch = booking.mentorId === this.mentorId;
          const statusMatch = booking.status.toLowerCase() === 'completed' || booking.status.toLowerCase() === 'finished';
          
          return mentorMatch && statusMatch;
        });
      },
      error: (error) => {
        this.menteeBookings = [];
      }
    });
  }

  openCreateReviewModal() {
    this.loadMenteeBookings();
    this.showCreateReviewModal = true;
    this.resetNewReview();
  }

  closeCreateReviewModal() {
    const toastContent = document.querySelector('.toast-content');
    if (toastContent) {
      toastContent.classList.add('closing');
      setTimeout(() => {
        this.showCreateReviewModal = false;
        this.selectedBookingForReview = null;
        this.resetNewReview();
      }, 300);
    } else {
      this.showCreateReviewModal = false;
      this.selectedBookingForReview = null;
      this.resetNewReview();
    }
  }

  openEditReviewModal(review: any) {
    this.editingReview = { ...review };
    this.showEditReviewModal = true;
  }

  closeEditReviewModal() {
    const toastContent = document.querySelector('.toast-content');
    if (toastContent) {
      toastContent.classList.add('closing');
      setTimeout(() => {
        this.showEditReviewModal = false;
        this.editingReview = null;
      }, 300);
    } else {
      this.showEditReviewModal = false;
      this.editingReview = null;
    }
  }

  resetNewReview() {
    this.newReview = {
      reviewerId: this.menteeId || 0,
      reviewedUserId: this.mentorId || 0,
      bookingId: 0,
      rating: 5,
      comment: ''
    };
  }

  selectBookingForReview(booking: any) {
    this.selectedBookingForReview = booking;
    this.newReview.bookingId = booking.bookingId;
  }

  createReview() {
    if (!this.selectedBookingForReview || !this.newReview.comment.trim()) {
      this.showToast('Please select a booking and enter a comment.', 'error');
      return;
    }

    this.http.post(`${environment.apiUrl}/mentee-reviews`, this.newReview).subscribe({
      next: (response) => {
        this.loadMentorReviews();
        this.closeCreateReviewModal();
        this.showToast('Review created successfully!', 'success');
      },
      error: (error) => {
        let errorMessage = 'Failed to create review. Please try again.';
        
        if (error && error.error) {
          if (typeof error.error === 'string') {
            errorMessage = `Failed to create review: ${error.error}`;
          } else if (error.error.message) {
            errorMessage = `Failed to create review: ${error.error.message}`;
          }
        }
        
        this.showToast(errorMessage, 'error');
      }
    });
  }

  updateReview() {
    if (!this.editingReview || !this.editingReview.comment.trim()) {
      alert('Please enter a comment.');
      return;
    }

    const reviewId = this.editingReview.reviewId || this.editingReview.id;

    if (!reviewId) {
      this.showToast('Review ID is missing. Cannot update review.', 'error');
      return;
    }

    this.http.put(`${environment.apiUrl}/mentee-reviews/${reviewId}`, this.editingReview).subscribe({
      next: (response) => {
        this.loadMentorReviews();
        this.closeEditReviewModal();
        this.showToast('Review updated successfully!', 'success');
      },
      error: (error) => {
        let errorMessage = 'Failed to update review. Please try again.';
        
        if (error && error.error) {
          if (typeof error.error === 'string') {
            errorMessage = `Failed to update review: ${error.error}`;
          } else if (error.error.message) {
            errorMessage = `Failed to update review: ${error.error.message}`;
          }
        }
        
        this.showToast(errorMessage, 'error');
      }
    });
  }

  deleteReview(reviewId: number) {
    this.showDeleteConfirmation(reviewId);
  }

  showDeleteConfirmation(reviewId: number) {
    this.pendingDeleteReviewId = reviewId;
    this.showDeleteConfirmModal = true;
  }

  openDeleteConfirmModal(reviewId: string | number) {
    this.pendingDeleteReviewId = Number(reviewId);
    this.showDeleteConfirmModal = true;
  }

  confirmDeleteReview() {
    if (!this.pendingDeleteReviewId) {
      return;
    }

    this.http.delete(`${environment.apiUrl}/mentee-reviews/${this.pendingDeleteReviewId}`).subscribe({
      next: (response) => {
        this.loadMentorReviews();
        this.showToast('Review deleted successfully!', 'success');
        this.closeDeleteConfirmModal();
      },
      error: (error) => {
        this.showToast('Failed to delete review. Please try again.', 'error');
        this.closeDeleteConfirmModal();
      }
    });
  }

  closeDeleteConfirmModal() {
    this.showDeleteConfirmModal = false;
    this.pendingDeleteReviewId = null;
  }

  canEditOrDeleteReview(review: any): boolean {
    return review.reviewerId === this.menteeId;
  }

  formatReviewDate(dateString: string): string {
    if (!dateString) return 'Invalid Date';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      return 'Invalid Date';
    }
  }

  getDisplayedReviews(): any[] {
    if (this.showAllReviews) {
      return this.reviews;
    }
    return this.reviews.slice(0, this.reviewsPerPage);
  }

  getExperienceYears(): string {
    return this.mentor?.experienceYears || '5+';
  }

  getSessionsCount(): string {
    return this.mentor?.sessionsCompleted || '50+';
  }

  getResponseTime(): string {
    return this.mentor?.responseTime || '< 2h';
  }

  trackByReview(index: number, review: any): number {
    return review.reviewId || review.id || index;
  }

  trackByAvailability(index: number, availability: any): string {
    return availability.dayName;
  }

  trackByTimeSlot(index: number, timeSlot: string): string {
    return timeSlot;
  }

  bookSession() {
    if (!this.authService.isLoggedIn()) {
      alert('Unable to book session. Please log in again.');
      this.router.navigate(['/login']);
      return;
    }

    const currentUser = this.authService.currentUserValue;
    if (!currentUser) {
      alert('Unable to book session. Please log in again.');
      this.router.navigate(['/login']);
      return;
    }

    const menteeId = currentUser.userId || this.menteeId;

    if (this.mentorId && this.hasAvailability() && menteeId) {
      const navigationPath = ['/mentee/booking-form'];
      
      this.router.navigate(navigationPath, { 
        queryParams: { 
          mentorId: this.mentorId,
          mentorName: this.mentor?.fullName,
          hourlyRate: this.mentor?.hourlyRate
        } 
      });
    } else {
      alert('Unable to book session. Missing required information.');
    }
  }

  showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToastNotification = true;
    
    setTimeout(() => {
      this.hideToast();
    }, 3000);
  }

  hideToast() {
    this.showToastNotification = false;
  }

  getReviewerDisplayName(review: any): string {
    if (review.reviewerId === this.menteeId) {
      return 'You';
    }
    return review.menteeName || `Mentee #${review.reviewerId}` || 'Anonymous';
  }
}
