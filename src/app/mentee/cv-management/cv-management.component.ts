import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenteeLayoutComponent } from '../mentee-layout.component';

interface CVFile {
  id: number;
  name: string;
  uploadedAt: string;
  size: number;
  type: string;
  active: boolean;
  comments: string[];
}

@Component({
  selector: 'app-cv-management',
  standalone: true,
  imports: [CommonModule, MenteeLayoutComponent],
  templateUrl: './cv-management.component.html',
  styleUrls: ['./cv-management.component.css']
})
export class CvManagementComponent {
  cvs: CVFile[] = [
    { id: 1, name: 'CV_2025.pdf', uploadedAt: '2025-06-01', size: 320000, type: 'application/pdf', active: true, comments: ['Great structure!', 'Add more about your projects.'] },
    { id: 2, name: 'Resume.docx', uploadedAt: '2025-05-20', size: 210000, type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', active: false, comments: [] }
  ];
  dragOver = false;
  fileError = '';
  maxFileSize = 2 * 1024 * 1024; // 2MB
  allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    this.dragOver = false;
    if (event.dataTransfer && event.dataTransfer.files.length) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.handleFile(input.files[0]);
    }
  }

  handleFile(file: File) {
    this.fileError = '';
    if (!this.allowedTypes.includes(file.type)) {
      this.fileError = 'Invalid file type. Only PDF and Word documents are allowed.';
      return;
    }
    if (file.size > this.maxFileSize) {
      this.fileError = 'File is too large. Maximum size is 2MB.';
      return;
    }
    // Simulate upload
    this.cvs.unshift({
      id: Date.now(),
      name: file.name,
      uploadedAt: new Date().toISOString().slice(0, 10),
      size: file.size,
      type: file.type,
      active: false,
      comments: []
    });
  }

  setActive(cv: CVFile) {
    this.cvs.forEach(f => f.active = false);
    cv.active = true;
    // No alert, just set active
  }

  deleteCV(cv: CVFile) {
    if (confirm(`Are you sure you want to delete ${cv.name}?`)) {
      this.cvs = this.cvs.filter(f => f.id !== cv.id);
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
}
