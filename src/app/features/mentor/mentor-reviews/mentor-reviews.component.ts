import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { MentorReview } from '../../../Models/Review/mentor-review.interface';
import { ReviewService } from '../../../Services/review.service';
import { AuthService } from '../../../Services/auth.service';
import { FloatingDashboardButtonComponent } from '../../../shared/components/floating-dashboard-button/floating-dashboard-button.component';

@Component({
  selector: 'app-mentor-reviews',
  templateUrl: './mentor-reviews.component.html',
  styleUrls: ['./mentor-reviews.component.css'],
  standalone: true,
  imports: [CommonModule, RouterLink, FloatingDashboardButtonComponent]
})
export class MentorReviewsComponent implements OnInit {
  @Input() showSummary: boolean = false; 
  @Input() maxReviews: number = 5; 
  
  reviews: MentorReview[] = [];
  displayedReviews: MentorReview[] = [];
  isLoading = true;
  error: string | null = null;
  

  currentPage: number = 1;
  itemsPerPage: number = 12;
  totalPages: number = 0;

  constructor(
    private reviewService: ReviewService, 
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchReviews();
  }

  goBack(): void {
    this.router.navigate(['/mentor/dashboard']);
  }

  fetchReviews(): void {
    this.isLoading = true;
    this.error = null;
    this.reviewService.getMyMentorReviews().subscribe({
      next: (reviews) => {
       
        this.reviews = reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        if (this.showSummary) {
        
          this.displayedReviews = this.reviews.slice(0, this.maxReviews);
        } else {
         
          this.updatePagination();
        }
        
        this.isLoading = false;
      },
      error: (err) => {
        if (err.status === 404) {
          this.reviews = [];
          this.displayedReviews = [];
          this.isLoading = false;
        } else {
          this.error = 'Failed to load reviews. Please try again.';
          this.isLoading = false;
        }
      }
    });
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.reviews.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.displayedReviews = this.reviews.slice(startIndex, endIndex);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  getAverageRating(): number {
    if (!this.reviews.length) return 0;
    const sum = this.reviews.reduce((acc, r) => acc + r.rating, 0);
    return +(sum / this.reviews.length).toFixed(2);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, this.currentPage - 2);
      const endPage = Math.min(this.totalPages, this.currentPage + 2);
      
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) pages.push(-1); 
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      if (endPage < this.totalPages) {
        if (endPage < this.totalPages - 1) pages.push(-1);
        pages.push(this.totalPages);
      }
    }
    
    return pages;
  }
}
