import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenteeLayoutComponent } from '../mentee-layout.component';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../Services/auth.service';
@Component({
  selector: 'app-mentor-profile-view',
  standalone: true,
  imports: [CommonModule, FormsModule, MenteeLayoutComponent],
  templateUrl: './mentor-profile-view.component.html',
  styleUrls: ['./mentor-profile-view.component.css']
})
export class MentorProfileViewComponent implements OnInit {
  mentor: any = null;
  mentorId: number | null = null;
  menteeId: number | null = null;
  reviews: any[] = [];
  loading = true;
  
  // Free slots from the new endpoint
  freeSlots: any[] = [];
  loadingSlots = false;

  // Additional properties for enhanced UI
  showAllReviews = false;
  showAllSkills = false;
  reviewsPerPage = 3;
  isFavorite = false;

  // Review management properties
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

  // Toast notification properties
  showToastNotification = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' = 'success';

  // Delete confirmation properties
  showDeleteConfirmModal = false;
  pendingDeleteReviewId: number | null = null;
  reviewToDeleteId: number | null = null; // Track the review ID to delete

  // Availability pagination properties
  currentAvailabilityPage = 0;
  availabilityPerPage = 3; // Show 3 days at a time
  showAllAvailability = false;

  constructor(
    private route: ActivatedRoute, 
    private http: HttpClient, 
    public router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      // Get menteeId from AuthService
      this.menteeId = this.authService.getCurrentUserId();
      
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
        
        // Load free slots
        this.loadFreeSlots();
        
        // Load reviews using the new endpoint
        this.loadMentorReviews();
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading mentor data:', err);
        this.loading = false;
        this.mentor = null;
        this.reviews = [];
      }
    });
  }

  private loadMentorReviews() {
    if (!this.mentorId) return;

    this.http.get<any[]>(`https://localhost:7001/api/mentee-reviews/mentor/${this.mentorId}`).subscribe({
      next: async (reviews) => {
        this.reviews = reviews;
        console.log('Reviews loaded from new endpoint:', this.reviews);
        console.log('First review structure:', this.reviews.length > 0 ? this.reviews[0] : 'No reviews');
        
        // Process each review to fetch reviewer names
        const reviewPromises = this.reviews.map(async (review) => {
          if (review.reviewerId && !review.menteeName) {
            try {
              console.log(`Fetching mentee data for reviewerId: ${review.reviewerId}`);
              // Try different API endpoints to find mentee info
              let menteeData;
              
              try {
                menteeData = await this.http.get<any>(`https://localhost:7001/api/mentees/details/${review.reviewerId}`).toPromise();
                console.log('Mentee data from /api/mentees/details:', menteeData);
              } catch (error) {
                console.log('Failed with /api/mentees/details, trying /api/mentees/profile');
                try {
                  menteeData = await this.http.get<any>(`https://localhost:7001/api/mentees/profile/${review.reviewerId}`).toPromise();
                  console.log('Mentee data from /api/mentees/profile:', menteeData);
                } catch (error2) {
                  console.log('Failed with /api/mentees/profile, trying /api/mentees');
                  menteeData = await this.http.get<any>(`https://localhost:7001/api/mentees/${review.reviewerId}`).toPromise();
                  console.log('Mentee data from /api/mentees:', menteeData);
                }
              }
              
              if (menteeData) {
                review.menteeName = menteeData.fullName || menteeData.name || menteeData.firstName + ' ' + (menteeData.lastName || '').trim() || 'Mentee';
                console.log(`Set mentee name for review ${review.reviewId}: ${review.menteeName}`);
              } else {
                review.menteeName = `Mentee #${review.reviewerId}`;
              }
            } catch (error) {
              console.warn(`Failed to fetch mentee name for ID ${review.reviewerId}:`, error);
              review.menteeName = `Mentee #${review.reviewerId}`;
            }
          } else if (!review.menteeName) {
            review.menteeName = 'Anonymous';
          }
          return review;
        });
        
        // Wait for all names to be fetched
        await Promise.all(reviewPromises);
        console.log('All reviews processed with names:', this.reviews);
      },
      error: (reviewError) => {
        console.warn('Failed to load reviews from new endpoint:', reviewError);
        this.reviews = []; // Set empty array if reviews fail
      }
    });
  }

  private loadFreeSlots() {
    if (!this.mentorId) return;

    this.loadingSlots = true;
    this.http.get<any[]>(`https://localhost:7001/api/mentors/mentors/${this.mentorId}/free-slots`).subscribe({
      next: (slots) => {
        // Filter out past slots
        const now = new Date();
        this.freeSlots = slots.filter(slot => {
          const slotStart = new Date(slot.start);
          return slotStart > now;
        });
        console.log('Free slots loaded:', this.freeSlots);
        this.loadingSlots = false;
      },
      error: (err) => {
        console.error('Error loading free slots:', err);
        this.freeSlots = [];
        this.loadingSlots = false;
      }
    });
  }

  hasAvailability(): boolean {
    return this.freeSlots && this.freeSlots.length > 0;
  }

  getGroupedFreeSlots(): any[] {
    if (!this.freeSlots || this.freeSlots.length === 0) return [];
    
    // Group slots by date and remove duplicates
    const grouped = new Map();
    
    this.freeSlots.forEach(slot => {
      const slotDate = new Date(slot.start);
      const dateKey = slotDate.toDateString();
      
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, {
          date: slotDate,
          dayName: slotDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'short', 
            day: 'numeric' 
          }),
          slots: []
        });
      }
      
      // Create unique slot identifier to avoid duplicates
      const slotIdentifier = `${slot.start}-${slot.end}`;
      const existingSlots = grouped.get(dateKey).slots;
      
      // Only add if this exact time slot doesn't already exist
      if (!existingSlots.some((s: any) => `${s.start}-${s.end}` === slotIdentifier)) {
        existingSlots.push({
          timeRange: this.formatTimeRange(slot.start, slot.end),
          start: slot.start,
          end: slot.end,
          formatted: slot.formatted
        });
      }
    });

    // Convert to array and sort by date
    const allGroupedSlots = Array.from(grouped.values()).sort((a, b) => 
      a.date.getTime() - b.date.getTime()
    );

    // Apply pagination if not showing all
    if (!this.showAllAvailability) {
      const startIndex = this.currentAvailabilityPage * this.availabilityPerPage;
      return allGroupedSlots.slice(startIndex, startIndex + this.availabilityPerPage);
    }

    return allGroupedSlots;
  }

  // Get all grouped slots for pagination calculations
  getAllGroupedFreeSlots(): any[] {
    if (!this.freeSlots || this.freeSlots.length === 0) return [];
    
    const grouped = new Map();
    
    this.freeSlots.forEach(slot => {
      const slotDate = new Date(slot.start);
      const dateKey = slotDate.toDateString();
      
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, {
          date: slotDate,
          dayName: slotDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'short', 
            day: 'numeric' 
          }),
          slots: []
        });
      }
      
      const slotIdentifier = `${slot.start}-${slot.end}`;
      const existingSlots = grouped.get(dateKey).slots;
      
      if (!existingSlots.some((s: any) => `${s.start}-${s.end}` === slotIdentifier)) {
        existingSlots.push({
          timeRange: this.formatTimeRange(slot.start, slot.end),
          start: slot.start,
          end: slot.end,
          formatted: slot.formatted
        });
      }
    });

    return Array.from(grouped.values()).sort((a, b) => 
      a.date.getTime() - b.date.getTime()
    );
  }

  formatTimeRange(startTime: string, endTime: string): string {
    // Parse the times from ISO strings
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    // Subtract 3 hours to correct the timezone difference
    // This compensates for the 3-hour increase problem
    const correctedStart = new Date(start.getTime() - (3 * 60 * 60 * 1000));
    const correctedEnd = new Date(end.getTime() - (3 * 60 * 60 * 1000));
    
    const startFormatted = correctedStart.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
    
    const endFormatted = correctedEnd.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
    
    return `${startFormatted} - ${endFormatted}`;
  }

  // Legacy method - kept for backward compatibility
  getGroupedAvailabilities(): any[] {
    // Use the new free slots method
    return this.getGroupedFreeSlots();
  }

  // Availability pagination methods
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

  // Review Management Methods
  loadMenteeBookings() {
    if (!this.menteeId) return;
    
    this.http.get<any[]>(`https://localhost:7001/api/MenteeBookings/mentee/${this.menteeId}/all`).subscribe({
      next: (bookings) => {
        // Filter completed bookings that can be reviewed
        this.menteeBookings = bookings.filter(booking => 
          booking.mentorId === this.mentorId && 
          booking.status === 'Completed' &&
          new Date(booking.endDateTime) < new Date()
        );
        console.log('Mentee bookings loaded:', this.menteeBookings);
      },
      error: (error) => {
        console.error('Failed to load mentee bookings:', error);
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
    // Add closing animation
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
    console.log('Opening edit modal for review:', review);
    console.log('Review ID:', review.id);
    console.log('Review keys:', Object.keys(review));
    this.editingReview = { ...review };
    this.showEditReviewModal = true;
  }

  closeEditReviewModal() {
    // Add closing animation
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

    this.http.post('https://localhost:7001/api/mentee-reviews', this.newReview).subscribe({
      next: (response) => {
        console.log('Review created successfully:', response);
        this.loadMentorReviews(); // Reload reviews
        this.closeCreateReviewModal();
        this.showToast('Review created successfully!', 'success');
      },
      error: (error) => {
        console.error('Failed to create review:', error);
        let errorMessage = 'Failed to create review. Please try again.';
        
        // Extract the specific error message if available
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

    console.log('Updating review:', this.editingReview);
    
    // Try to get the ID from either reviewId or id property
    const reviewId = this.editingReview.reviewId || this.editingReview.id;
    console.log('Review ID for update:', reviewId);

    if (!reviewId) {
      console.error('Review ID is missing! Available properties:', Object.keys(this.editingReview));
      this.showToast('Review ID is missing. Cannot update review.', 'error');
      return;
    }

    this.http.put(`https://localhost:7001/api/mentee-reviews/${reviewId}`, this.editingReview).subscribe({
      next: (response) => {
        console.log('Review updated successfully:', response);
        this.loadMentorReviews(); // Reload reviews
        this.closeEditReviewModal();
        this.showToast('Review updated successfully!', 'success');
      },
      error: (error) => {
        console.error('Failed to update review:', error);
        let errorMessage = 'Failed to update review. Please try again.';
        
        // Extract the specific error message if available
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
    // Show confirmation toast instead of alert
    this.showDeleteConfirmation(reviewId);
  }

  showDeleteConfirmation(reviewId: number) {
    this.pendingDeleteReviewId = reviewId;
    this.showDeleteConfirmModal = true;
  }

  // Open delete confirmation modal
  openDeleteConfirmModal(reviewId: string | number) {
    console.log('Opening delete confirmation modal for review ID:', reviewId);
    this.pendingDeleteReviewId = Number(reviewId);
    this.showDeleteConfirmModal = true;
    console.log('Modal state set to:', this.showDeleteConfirmModal);
  }

  confirmDeleteReview() {
    if (!this.pendingDeleteReviewId) {
      return;
    }

    this.http.delete(`https://localhost:7001/api/mentee-reviews/${this.pendingDeleteReviewId}`).subscribe({
      next: (response) => {
        console.log('Review deleted successfully:', response);
        this.loadMentorReviews(); // Reload reviews
        this.showToast('Review deleted successfully!', 'success');
        this.closeDeleteConfirmModal();
      },
      error: (error) => {
        console.error('Failed to delete review:', error);
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
    // Check if this review belongs to the current mentee
    console.log('Checking if can edit/delete review:', {
      reviewerId: review.reviewerId,
      currentMenteeId: this.menteeId,
      canEdit: review.reviewerId === this.menteeId
    });
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

  // Get displayed reviews based on showAllReviews flag
  getDisplayedReviews(): any[] {
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
    // First check if user is authenticated using AuthService
    if (!this.authService.isLoggedIn()) {
      alert('Unable to book session. Please log in again.');
      this.router.navigate(['/login']);
      return;
    }

    // Get current user from AuthService
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) {
      alert('Unable to book session. Please log in again.');
      this.router.navigate(['/login']);
      return;
    }

    // Use the userId from the current user
    const menteeId = currentUser.userId || this.menteeId;

    if (this.mentorId && this.hasAvailability() && menteeId) {
      // Navigate to booking form
      const navigationPath = ['/mentee/booking-form'];
      console.log('Navigating to booking form:', navigationPath);
      
      this.router.navigate(navigationPath, { 
        queryParams: { 
          mentorId: this.mentorId,
          mentorName: this.mentor?.fullName,
          hourlyRate: this.mentor?.hourlyRate
        } 
      });
    } else {
      console.error('Missing required data for booking:', {
        mentorId: this.mentorId,
        hasAvailability: this.hasAvailability(),
        menteeId: menteeId
      });
      alert('Unable to book session. Missing required information.');
    }
  }

  // Toast notification methods
  showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToastNotification = true;
    
    // Auto hide after 3 seconds
    setTimeout(() => {
      this.hideToast();
    }, 3000);
  }

  hideToast() {
    this.showToastNotification = false;
  }

  // Get reviewer display name with fallback
  getReviewerDisplayName(review: any): string {
    if (review.reviewerId === this.menteeId) {
      return 'You';
    }
    return review.menteeName || `Mentee #${review.reviewerId}` || 'Anonymous';
  }
}
