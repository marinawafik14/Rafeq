import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CvService } from '../../Services/cv.service';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../Services/auth.service';

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
export class CvManagementComponent implements OnInit {
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

  // Base URL for API calls
  private apiBaseUrl = 'https://localhost:7001/api';
  private maxFileSize = 2 * 1024 * 1024; // 2MB in bytes

  constructor(
    private cvService: CvService, 
    private route: ActivatedRoute, 
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Get current user ID from AuthService
    this.menteeId = this.authService.getCurrentUserId();
    
    if (this.authService.currentUserValue) {
      this.menteeName = this.authService.currentUserValue.fullName;
    }
    
    // Load CVs for current user
    this.loadCVs();
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
          size: null, // Not provided in response
          type: cv.fileName?.split('.').pop() || '',
          active: cv.isActive,
          comments: [], // Will be loaded per CV
          userFullName: cv.userFullName,
        }));
        this.loading = false;
        // Load comments for each CV
        this.cvs.forEach(cv => this.loadCommentsForCV(cv));
      },
      error: (err) => {
        this.error = 'Failed to load CVs. Please refresh the page and try again.';
        this.loading = false;
        console.error('Error loading CVs:', err);
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
        console.error(`Error loading comments for CV ${cv.id}:`, err);
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
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0 && this.menteeId) {
      this.handleFileUpload(input.files[0]);
      input.value = ''; // Reset input to allow selecting the same file again
    }
  }

  private validateFile(file: File): boolean {
    this.fileError = null;
    
    // Check file size
    if (file.size > this.maxFileSize) {
      this.fileError = `File is too large. Maximum size is 2MB.`;
      return false;
    }
    
    // Check file type
    const validTypes = ['.pdf', '.doc', '.docx'];
    const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    
    if (!validTypes.includes(fileExtension)) {
      this.fileError = `Invalid file type. Accepted formats: PDF, DOC, DOCX.`;
      return false;
    }
    
    return true;
  }

  private handleFileUpload(file: File) {
    if (!this.menteeId) {
      this.fileError = 'Authentication error. Please log in again.';
      return;
    }
    
    if (!this.validateFile(file)) {
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    this.uploadingFile = true;
    this.fileError = null;
    
    this.http.post(`${this.apiBaseUrl}/MenteeCVs/mentee/${this.menteeId}`, formData, { 
      headers: this.getAuthHeaders() 
    }).subscribe({
      next: () => {
        this.uploadingFile = false;
        this.loadCVs(); // Refresh the list
      },
      error: err => {
        this.uploadingFile = false;
        this.fileError = 'Failed to upload CV. Please try again.';
        console.error('Error uploading CV:', err);
      }
    });
  }

  deleteCV(cv: CV) {
    if (!cv.id || !this.menteeId) return;
    
    if (!confirm('Are you sure you want to delete this CV?')) {
      return;
    }

    this.http.delete(`${this.apiBaseUrl}/MenteeCVs/mentee/${this.menteeId}/${cv.id}`, { 
      headers: this.getAuthHeaders() 
    }).subscribe({
      next: () => {
        this.cvs = this.cvs.filter(item => item.id !== cv.id);
      },
      error: err => {
        this.error = 'Failed to delete CV.';
        console.error('Error deleting CV:', err);
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

  retryLoadCVs() {
    this.loadCVs();
  }
}