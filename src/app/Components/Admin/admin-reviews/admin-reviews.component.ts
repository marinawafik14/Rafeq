import { Component, OnInit } from '@angular/core';
import { ReviewService } from '../../../Services/review.service';
import { Reviews } from '../../../Models/Reviews'; 
import Swal from 'sweetalert2'; 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-reviews',
  templateUrl: './admin-reviews.component.html',
  styleUrls: ['./admin-reviews.component.css'], 
  standalone: true, 
  imports: [CommonModule, FormsModule] // Add FormsModule for ngModel
})
export class AdminReviewsComponent implements OnInit {
  
  reviewsList: Reviews[] = [];
  loading: boolean = true; 
  error: string | null = null; 

  // Add Math property for template access
  Math = Math;

  // Add pagination properties
  currentPage: number = 1;
  itemsPerPage: number = 10;
  searchQuery: string = '';
  ratingFilter: string = '';

  constructor(public _reviewService: ReviewService) {}

  ngOnInit(): void {
    this.loadReviews();
  }

  // Keep only ONE loadReviews method - the main implementation
  loadReviews() {
    this.loading = true;
    this.error = null; 

    this._reviewService.getReviews().subscribe({
      next: (data) => {
        this.reviewsList = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.loading = false;
        //console.log("Reviews loaded:", data);
        
        if (this.reviewsList.length === 0) {
          console.log('No reviews found.');
        }
      },
      error: (err) => {
        console.error('Failed to load reviews:', err);
        this.error = 'Failed to load reviews. Please check your network or try again later.';
        this.loading = false;
      }
    });
  }

  deleteReview(id: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This review will be deleted permanently!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33', 
      cancelButtonColor: '#3085d6', 
      confirmButtonText: 'Yes, delete!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this._reviewService.deleteReview(id).subscribe({
          next: () => {
            this.loadReviews(); 
            Swal.fire('Deleted!', 'Review has been deleted.', 'success');
          },
          error: (err) => {
            console.error('Failed to delete review:', err);
            Swal.fire('Error', 'Failed to delete review.', 'error');
          }
        });
      }
    });
  }

  getStarArray(rating: number | null | undefined): number[] {
    const validRating = rating !== null && rating !== undefined && !isNaN(rating) ? Math.max(0, rating) : 0;
    return Array(validRating).fill(0);
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) {
      return 'N/A Date';
    }
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year:'numeric', day:'2-digit', month:'2-digit'});
    } catch (e) {
      console.error('Invalid date string:', dateString, e);
      return 'Invalid Date';
    }
  }

  getAverageRating(): string {
    if (this.reviewsList.length === 0) return '0.0';
    const total = this.reviewsList.reduce((sum, review) => sum + (review.rating || 0), 0);
    const average = total / this.reviewsList.length;
    return average.toFixed(1);
  }

  getTodayReviews(): number {
    const today = new Date();
    return this.reviewsList.filter(review => {
      if (!review.createdAt) return false;
      const reviewDate = new Date(review.createdAt);
      return reviewDate.toDateString() === today.toDateString();
    }).length;
  }

  getTopRatedMentor(): string {
    if (this.reviewsList.length === 0) return 'N/A';
    
    const mentorRatings = this.reviewsList.reduce((acc, review) => {
      const mentorName = review.reviewerName || 'Unknown';
      if (!acc[mentorName]) {
        acc[mentorName] = { total: 0, count: 0 };
      }
      acc[mentorName].total += review.rating || 0;
      acc[mentorName].count += 1;
      return acc;
    }, {} as Record<string, { total: number, count: number }>);
    
    let topMentor = 'N/A';
    let highestAverage = 0;
    
    Object.entries(mentorRatings).forEach(([mentor, data]) => {
      const average = data.total / data.count;
      if (average > highestAverage) {
        highestAverage = average;
        topMentor = mentor;
      }
    });
    
    return topMentor;
  }

  getFilteredReviews() {
    return this.reviewsList.filter(review => {
      const matchesSearch = !this.searchQuery || 
        (review.reviewerName?.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
        (review.reviewedUserName?.toLowerCase().includes(this.searchQuery.toLowerCase()));
      
      const matchesRating = !this.ratingFilter || 
        review.rating === parseInt(this.ratingFilter);
      
      return matchesSearch && matchesRating;
    });
  }

  getPaginatedReviews() {
    const filtered = this.getFilteredReviews();
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  }

  get totalPages(): number {
    return Math.ceil(this.getFilteredReviews().length / this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page > 0 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  exportReviews(): void {
    // Add export functionality
   // console.log('Exporting reviews...');
    
    // Simple CSV export
    const csvData = this.reviewsList.map(review => ({
      'Reviewer': review.reviewerName || 'Unknown',
      'Reviewed User': review.reviewedUserName || 'Unknown',
      'Rating': review.rating || 0,
      'Comment': review.comment || 'No comment',
      'Date': this.formatDate(review.createdAt?.toString())
    }));
    
    const csvContent = this.convertToCSV(csvData);
    this.downloadCSV(csvContent, 'reviews-export.csv');
  }

  // Helper methods for CSV export
  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';
    
    const header = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      ).join(',')
    );
    
    return [header, ...rows].join('\n');
  }

  private downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Refresh method for the refresh button
  refreshReviews(): void {
    this.loadReviews();
  }
}