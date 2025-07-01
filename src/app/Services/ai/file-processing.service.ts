import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { FileAttachment } from '../../Models/ai/file-attachment';
import { environment } from '../../environments/environment';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

@Injectable({
  providedIn: 'root'
})
export class FileProcessingService {

  constructor() {}

  // Process uploaded file
  processFile(file: File): Observable<FileAttachment> {
    if (!this.isValidFile(file)) {
      return throwError(() => new Error('Invalid file type or size'));
    }

    const fileAttachment: FileAttachment = {
      id: this.generateId(),
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      uploadedAt: new Date()
    };

    if (file.type === 'application/pdf') {
      return this.extractPDFText(file).pipe(
        map(text => ({ ...fileAttachment, content: text })),
        catchError(error => {
          console.error('PDF processing error:', error);
          return throwError(() => new Error('Failed to process PDF file'));
        })
      );
    } else if (file.type.startsWith('image/')) {
      return this.convertImageToBase64(file).pipe(
        map(base64 => ({ ...fileAttachment, base64Data: base64 })),
        catchError(error => {
          console.error('Image processing error:', error);
          return throwError(() => new Error('Failed to process image file'));
        })
      );
    } else {
      return throwError(() => new Error('Unsupported file type'));
    }
  }

  // Extract text from PDF
  private extractPDFText(file: File): Observable<string> {
    return from(this.processPDF(file));
  }

  private async processPDF(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }

      return fullText.trim();
    } catch (error) {
      console.error('PDF processing error:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  // Convert image to base64
  private convertImageToBase64(file: File): Observable<string> {
    return new Observable(observer => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        observer.next(base64);
        observer.complete();
      };
      reader.onerror = () => {
        observer.error(new Error('Failed to read image file'));
      };
      reader.readAsDataURL(file);
    });
  }

  // Validate file
  private isValidFile(file: File): boolean {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ];

    if (!allowedTypes.includes(file.type)) {
      return false;
    }

    const maxSize = file.type === 'application/pdf' 
      ? environment.openai.maxFileSize 
      : environment.openai.maxImageSize;

    return file.size <= maxSize;
  }

  // Get file type description
  getFileTypeDescription(fileType: string): string {
    const types: { [key: string]: string } = {
      'application/pdf': 'PDF Document',
      'image/jpeg': 'JPEG Image',
      'image/png': 'PNG Image',
      'image/gif': 'GIF Image',
      'image/webp': 'WebP Image'
    };
    return types[fileType] || 'Unknown File Type';
  }

  // Format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
