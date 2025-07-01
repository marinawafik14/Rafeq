import { Component, OnInit } from '@angular/core';
import { ReviewService } from '../../../Services/review.service';
import { Reviews } from '../../../Models/Reviews'; 
import Swal from 'sweetalert2'; 
import { CommonModule } from '@angular/common'; 

@Component({
  selector: 'app-admin-reviews',
  templateUrl: './admin-reviews.component.html',
  styleUrls: ['./admin-reviews.component.css'], 
  standalone: true, 
  imports: [CommonModule] 
})
export class AdminReviewsComponent implements OnInit {
  
  reviewsList: Reviews[] = [];
  loading: boolean = true; 
  error: string | null = null; 

  constructor(public _reviewService: ReviewService) {}

  ngOnInit(): void {
    this.loadReviews();
  }

  
  loadReviews() {
    this.loading = true;
    this.error = null; 

    this._reviewService.getReviews().subscribe({
      next: (data) => {
        this.reviewsList = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.loading = false;
        console.log("Reviews loaded:", data);
        
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
}