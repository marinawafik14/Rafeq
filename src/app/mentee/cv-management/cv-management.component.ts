import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { CvService } from '../../Services/cv.service';
import { AuthService } from '../../Services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { DomSanitizer } from '@angular/platform-browser';
import { MenteeLayoutComponent } from '../mentee-layout.component';
import { environment } from '../../environments/environment.development';

interface CV {
  id: number;
  name: string;
  uploadedAt: string;
  size: number | null;
  type: string;
  active: boolean;
  comments: any[];
  userFullName: string | null;
}

@Component({
  selector: 'app-cv-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cv-management.component.html',
  styleUrls: ['./cv-management.component.css']
})
export class CvManagementComponent implements OnInit, OnDestroy {
  cvs: CV[] = [];
  loading = true;
  error: string | null = null;
  menteeId: number | null = null;
  menteeName: string = '';
  dragOver = false;
  fileError: string | null = null;
  selectedComments: any[] = [];
  showCommentsModal = false;
  selectedCV: CV | null = null;
  uploadingFile = false;

  showDeleteConfirm = false;
  cvToDelete: CV | null = null;

  private apiBaseUrl = environment.apiUrl;
  private maxFileSize = 2 * 1024 * 1024; // 2MB in bytes

  constructor(
    private cvService: CvService, 
    private route: ActivatedRoute, 
    private http: HttpClient,
    private authService: AuthService,
    private toastr: ToastrService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.menteeId = this.authService.getCurrentUserId();
    
    if (this.authService.currentUserValue) {
      this.menteeName = this.authService.currentUserValue.fullName;
    }
        this.loadCVs();
  }

  ngOnDestroy() {
    this.toastr.clear();
  }

  private loadCVs() {
    this.loading = true;
    this.error = null;
    
    this.cvService.getCurrentUserCVs().subscribe({
      next: (data) => {
        this.cvs = (data || []).map(cv => ({
          id: cv.cvId,
          name: cv.fileName,
          uploadedAt: this.formatDate(cv.uploadDate),
          size: null, 
          type: cv.fileName?.split('.').pop() || '',
          active: cv.isActive,
          comments: [],
          userFullName: cv.userFullName,
        }));
        
        this.loading = false;
        this.cvs.forEach(cv => this.loadCommentsForCV(cv));
      },
      error: (err) => {
        console.error('Error loading CVs:', err);
        this.loading = false;
        this.toastr.error('Failed to load CVs. Please refresh the page and try again.', 'Load Failed');
      }
    });
  }

  private formatDate(dateString: string): string {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private loadCommentsForCV(cv: CV) {
    this.http.get<any[]>(`${this.apiBaseUrl}/MenteeCVs/comments/${cv.id}`, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (comments) => {
        cv.comments = comments || [];
      },
      error: err => {
        cv.comments = [];
      }
    });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return token ? new HttpHeaders({ 'Authorization': `Bearer ${token}` }) : new HttpHeaders();
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    this.dragOver = false;
    
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFileUpload(event.dataTransfer.files[0]);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.dragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.dragOver = false;
  }

  onFileSelect(event: Event) {
    this.clearErrors(); 
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFileUpload(input.files[0]);
      input.value = ''; 
    }
  }

  private validateFile(file: File): boolean {
    this.fileError = null;
    
    if (file.size > this.maxFileSize) {
      this.toastr.error('File is too large. Maximum size is 2MB.', 'Invalid File');
      return false;
    }
    
    const validTypes = ['.pdf', '.doc', '.docx'];
    const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    
    if (!validTypes.includes(fileExtension)) {
      this.toastr.error('Invalid file type. Accepted formats: PDF, DOC, DOCX.', 'Invalid File');
      return false;
    }
    
    return true;
  }

  private handleFileUpload(file: File) {
    const token = this.authService.getToken();
    if (!token) {
      this.toastr.error('Authentication error. Please log in again.', 'Upload Failed');
      return;
    }
    
    if (!this.validateFile(file)) {
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    this.uploadingFile = true;
    this.fileError = null;    
    this.http.post(`${this.apiBaseUrl}/MenteeCVs`, formData, { 
      headers: this.getAuthHeaders() 
    }).subscribe({
      next: () => {
        this.uploadingFile = false;
        this.toastr.success('CV uploaded successfully!', 'Upload Complete');
        this.loadCVs(); 
      },
      error: err => {
        this.uploadingFile = false;
        if (err.status === 401) {
          this.toastr.error('Authentication failed. Please log in again.', 'Upload Failed');
        } else if (err.status === 413) {
          this.toastr.error('File is too large. Please try a smaller file.', 'Upload Failed');
        } else if (err.status === 400) {
          this.toastr.error('Invalid file format. Please use PDF, DOC, or DOCX.', 'Upload Failed');
        } else {
          this.toastr.error('Failed to upload CV. Please try again.', 'Upload Failed');
        }
      }
    });
  }

  deleteCV(cv: CV) {
    if (!cv.id) {
      console.warn('Cannot delete CV: No ID found'); 
      this.toastr.error('No CV ID found!', 'Error');
      return;
    }
    
    const token = this.authService.getToken();
    if (!token) {
      console.log('No auth token found');
      this.toastr.error('Authentication error. Please log in again.', 'Delete Failed');
      return;
    }
    
    this.cvToDelete = cv;
    this.showDeleteConfirm = true;
  }

  confirmDelete() {
    if (this.cvToDelete) {
      this.performDelete(this.cvToDelete);
      this.closeDeleteConfirm();
    }
  }

  closeDeleteConfirm() {
    this.showDeleteConfirm = false;
    this.cvToDelete = null;
  }

  private performDelete(cv: CV) {
    
    const deleteUrl = `${this.apiBaseUrl}/MenteeCVs/${cv.id}`;
    
    this.http.delete(deleteUrl, { 
      headers: this.getAuthHeaders() 
    }).subscribe({
      next: (response) => {
        this.cvs = this.cvs.filter(item => item.id !== cv.id);
        this.toastr.success('CV deleted successfully!', 'Delete Complete');
      },
      error: err => {
        console.error('Delete API error:', err);
        
        if (err.status === 401) {
          this.toastr.error('Authentication failed. Please log in again.', 'Delete Failed');
        } else if (err.status === 404) {
          this.toastr.error('CV not found or already deleted.', 'Delete Failed');
        } else {
          this.toastr.error('Failed to delete CV. Please try again.', 'Delete Failed');
        }
      }
    });
  }

  openCommentsModal(cv: CV) {
    this.selectedCV = cv;
    this.selectedComments = cv.comments;
    this.showCommentsModal = true;
  }

  closeCommentsModal() {
    this.showCommentsModal = false;
    this.selectedCV = null;
    this.selectedComments = [];
  }

  clearErrors() {
    this.error = null;
    this.fileError = null;
    this.toastr.clear(); 
  }

  retryLoadCVs() {
    this.clearErrors();
    this.loadCVs();
  }

}