import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CVReviewService } from '../../../Services/cv-review.service';
import { CVDetails } from '../../../Models/CV/cv-details';
import { CVComment } from '../../../Models/CV/cv-comment';
import { AddCVCommentRequest } from '../../../Models/CV/add-cv-comment-request';
import { FloatingDashboardButtonComponent } from '../../../shared/components/floating-dashboard-button/floating-dashboard-button.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-cv-review',
  standalone: true,
  imports: [CommonModule, FormsModule, FloatingDashboardButtonComponent],
  templateUrl: './cv-review.component.html',
  styleUrls: ['./cv-review.component.css']
})
export class CVReviewComponent implements OnInit {
  cvs: CVDetails[] = [];
  selectedCV: CVDetails | null = null;
  cvComments: CVComment[] = [];
  newComment: string = '';
  isLoading: boolean = true;
  isLoadingComments: boolean = false;
  isAddingComment: boolean = false;
  error: string | null = null;

  constructor(private cvReviewService: CVReviewService) {}

  ngOnInit(): void {
    this.loadCVs();
  }

  loadCVs(): void {
    this.isLoading = true;
    this.cvReviewService.getMenteeCVs().subscribe({
      next: (cvs) => {
        this.cvs = cvs;
        this.isLoading = false;
        if (cvs.length > 0) {
          this.selectCV(cvs[0]);
        }
      },
      error: (error) => {
        console.error('Error loading CVs:', error);
        this.error = 'Failed to load CVs';
        this.isLoading = false;
      }
    });
  }

  selectCV(cv: CVDetails): void {
    this.selectedCV = cv;
    this.loadComments(cv.cvId);
  }

  loadComments(cvId: number): void {
    this.isLoadingComments = true;
    this.cvReviewService.getCVComments(cvId).subscribe({
      next: (comments) => {
        this.cvComments = comments;
        this.isLoadingComments = false;
      },
      error: (error) => {
        console.error('Error loading comments:', error);
        this.isLoadingComments = false;
      }
    });
  }

  addComment(): void {
    if (!this.newComment.trim() || !this.selectedCV) return;

    this.isAddingComment = true;
    const request: AddCVCommentRequest = {
      cvId: this.selectedCV.cvId,
      comment: this.newComment.trim()
    };

    this.cvReviewService.addComment(request).subscribe({
      next: (comment) => {
        this.cvComments.push(comment);
        this.newComment = '';
        this.isAddingComment = false;
        Swal.fire({
          icon: 'success',
          title: 'Comment Added!',
          text: 'Your feedback has been added successfully.',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      },
      error: (error) => {
        console.error('Error adding comment:', error);
        this.isAddingComment = false;
        Swal.fire({
          icon: 'error',
          title: 'Failed to Add Comment',
          text: 'Please try again later.',
          confirmButtonColor: '#0a2e65'
        });
      }
    });
  }

  deleteComment(comment: CVComment): void {
    Swal.fire({
      title: 'Delete Comment?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.cvReviewService.deleteComment(comment.commentId).subscribe({
          next: () => {
            this.cvComments = this.cvComments.filter(c => c.commentId !== comment.commentId);
            Swal.fire({
              icon: 'success',
              title: 'Comment Deleted!',
              timer: 2000,
              showConfirmButton: false,
              toast: true,
              position: 'top-end'
            });
          },
          error: (error) => {
            console.error('Error deleting comment:', error);
            Swal.fire({
              icon: 'error',
              title: 'Failed to Delete',
              text: 'Please try again later.',
              confirmButtonColor: '#0a2e65'
            });
          }
        });
      }
    });
  }

  downloadCV(cv: CVDetails): void {
    const fileName = this.cvReviewService.getFileNameFromUrl(cv.downloadUrl);
    
    console.log('Downloading CV:', fileName);
    
    this.cvReviewService.getCVFile(fileName).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = cv.fileName;
        
        document.body.appendChild(link);
        link.click();
        
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        Swal.fire({
          icon: 'success',
          title: 'Download Started!',
          text: 'Your CV download should begin shortly.',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      },
      error: (error) => {
        console.error('Error downloading CV:', error);
        Swal.fire({
          icon: 'error',
          title: 'Download Failed',
          text: 'Unable to download the CV. Please check your permissions.',
          confirmButtonColor: '#0a2e65'
        });
      }
    });
  }

  openCVInNewTab(cv: CVDetails): void {
    const fileName = this.cvReviewService.getFileNameFromUrl(cv.downloadUrl);
    
    this.cvReviewService.getCVFile(fileName).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const newTab = window.open(url, '_blank');
        
        if (!newTab) {
          this.downloadCV(cv);
          Swal.fire({
            icon: 'info',
            title: 'Popup Blocked',
            text: 'Your browser blocked the popup. The CV will download instead.',
            confirmButtonColor: '#0a2e65'
          });
        } else {
          setTimeout(() => {
            window.URL.revokeObjectURL(url);
          }, 1000);
        }
      },
      error: (error) => {
        console.error('Error opening CV:', error);
        Swal.fire({
          icon: 'error',
          title: 'Failed to Open CV',
          text: 'Unable to open the CV. Please try downloading instead.',
          confirmButtonColor: '#0a2e65'
        });
      }
    });
  }

  getCVFileUrl(cv: CVDetails): string {
    return '#'; 
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}