import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CvService } from '../../Services/cv.service';
import { ActivatedRoute } from '@angular/router';
import { MenteeLayoutComponent } from '../mentee-layout.component';
import { HttpClient, HttpHeaders } from '@angular/common/http';

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
  imports: [CommonModule, MenteeLayoutComponent],
  templateUrl: './cv-management.component.html',
  styleUrls: ['./cv-management.component.css']
})
export class CvManagementComponent implements OnInit {
  cvs: CV[] = [];
  loading = true;
  uploading = false;
  error: string | null = null;
  menteeId: number | null = null;
  menteeName: string = '';
  dragOver = false;
  fileError: string | null = null;
  selectedComments: any[] = [];
  showCommentsModal = false;
  selectedCV: CV | null = null;
  showDeleteModal = false;
  cvToDelete: CV | null = null;

  // Base URL for API calls
  private apiBaseUrl = 'https://localhost:7001/api';

  constructor(
    private cvService: CvService, 
    private route: ActivatedRoute, 
    private http: HttpClient
  ) {}

  ngOnInit() {
    // Get menteeId from route params
    this.route.paramMap.subscribe(params => {
      const routeId = params.get('menteeId');
      this.menteeId = routeId ? +routeId : null;
    });
    this.loadCVs();
  }

  private loadCVs() {
    this.cvService.getCurrentUserCVs().subscribe({
      next: (data) => {
        this.cvs = (data || []).map(cv => ({
          id: cv.cvId,
          name: cv.fileName,
          uploadedAt: cv.uploadDate,
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
        this.error = 'Failed to load CVs.';
        this.loading = false;
        console.error('Error loading CVs:', err);
      }
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
        // Optionally log error
      }
    });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = document.cookie.split('; ').find(row => row.startsWith('authToken='))?.split('=')[1];
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
    if (input.files && input.files.length > 0) {
      this.handleFileUpload(input.files[0]);
      input.value = ''; // Reset input to allow selecting the same file again
    }
  }

  private handleFileUpload(file: File) {
    if (!this.menteeId) return;
    
    const formData = new FormData();
    formData.append('file', file);
    this.fileError = null;
    this.uploading = true;
    
    this.http.post(`${this.apiBaseUrl}/MenteeCVs/mentee/${this.menteeId}`, formData, { 
      headers: this.getAuthHeaders() 
    }).subscribe({
      next: () => {
        this.uploading = false;
        this.loadCVs(); // Refresh the list
      },
      error: err => {
        this.uploading = false;
        this.fileError = 'Failed to upload CV. Please try again.';
        console.error('Error uploading CV:', err);
      }
    });
  }

  // Modal-related methods for delete confirmation
  confirmDelete(cv: CV) {
    this.cvToDelete = cv;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.cvToDelete = null;
  }

  // Handle modal keyboard events
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.closeDeleteModal();
    }
  }

  // Template calls deleteCV() without parameters, so we support both signatures
  deleteCV(cv?: CV): void {
    const cvToDelete = cv || this.cvToDelete;
    if (!cvToDelete) return;

    if (!cvToDelete.id || !this.menteeId) return;
    
    this.http.delete(`${this.apiBaseUrl}/MenteeCVs/mentee/${this.menteeId}/${cvToDelete.id}`, { 
      headers: this.getAuthHeaders() 
    }).subscribe({
      next: () => {
        this.cvs = this.cvs.filter(item => item.id !== cvToDelete.id);
        this.closeDeleteModal();
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
}