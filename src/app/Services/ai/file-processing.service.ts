import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { FileAttachment } from '../../Models/ai/file-attachment';
import { environment } from '../../environments/environment';

declare var pdfjsLib: any;

@Injectable({
  providedIn: 'root'
})
export class FileProcessingService {

  private pdfLibLoaded = false;

  constructor() {
    this.loadPdfJs();
  }

  private async loadPdfJs(): Promise<void> {
    if (this.pdfLibLoaded) return;

    try {
      const pdfjsModule = await import('pdfjs-dist');
      (window as any).pdfjsLib = pdfjsModule;
      
      pdfjsModule.GlobalWorkerOptions.workerSrc = 
        'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
      
      this.pdfLibLoaded = true;
      console.log('📄 PDF.js loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load PDF.js:', error);
    }
  }

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
          return throwError(() => new Error('Failed to process PDF file. Please try uploading again or use a different format.'));
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

  private extractPDFText(file: File): Observable<string> {
    return from(this.processPDF(file));
  }

  private async processPDF(file: File): Promise<string> {
    await this.loadPdfJs();
    
    if (!this.pdfLibLoaded) {
      throw new Error('PDF.js library failed to load');
    }

    try {
      console.log('🔄 Processing PDF:', file.name);
      
      const arrayBuffer = await file.arrayBuffer();
      console.log('📊 ArrayBuffer size:', arrayBuffer.byteLength);
      
      const pdfjsLib = (window as any).pdfjsLib;
      
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
        cMapPacked: true,
        verbosity: 0 
      });
      
      const pdf = await loadingTask.promise;
      console.log('📄 PDF loaded, pages:', pdf.numPages);
      
      let fullText = '';

     
      for (let i = 1; i <= pdf.numPages; i++) {
        try {
          console.log(`📖 Processing page ${i}/${pdf.numPages}`);
          
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          
          const pageText = textContent.items
            .filter((item: any) => item.str && item.str.trim()) 
            .map((item: any) => item.str)
            .join(' ');
          
          if (pageText.trim()) {
            fullText += pageText + '\n';
          }
          
         
          page.cleanup();
          
        } catch (pageError) {
          console.warn(`⚠️ Error processing page ${i}:`, pageError);
     
        }
      }

     
      pdf.cleanup();

      const result = fullText.trim();
      console.log('✅ PDF processing complete, text length:', result.length);
      
      if (!result) {
        throw new Error('No readable text found in PDF');
      }
      
      return result;
      
    } catch (error: unknown) {
      console.error('❌ PDF processing error:', error);
      
      
      const errorMessage = this.getErrorMessage(error);
      
     
      if (errorMessage.includes('Invalid PDF')) {
        throw new Error('The PDF file appears to be corrupted or invalid');
      } else if (errorMessage.includes('password')) {
        throw new Error('This PDF is password protected and cannot be processed');
      } else if (errorMessage.includes('No readable text')) {
        throw new Error('This PDF contains no readable text (might be an image-based PDF)');
      } else {
        throw new Error(`Failed to process PDF: ${errorMessage}`);
      }
    }
  }


  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as any).message);
    }
    return 'Unknown error occurred';
  }

 
  private convertImageToBase64(file: File): Observable<string> {
    return new Observable(observer => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          observer.next(base64);
          observer.complete();
        } catch (error) {
          observer.error(new Error('Failed to convert image to base64'));
        }
      };
      reader.onerror = () => {
        observer.error(new Error('Failed to read image file'));
      };
      reader.readAsDataURL(file);
    });
  }

 
  private isValidFile(file: File): boolean {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ];

    if (!allowedTypes.includes(file.type)) {
      console.warn('❌ Invalid file type:', file.type);
      return false;
    }

    const maxSize = file.type === 'application/pdf' 
      ? (environment as any).openai?.maxFileSize || 10 * 1024 * 1024 
      : (environment as any).openai?.maxImageSize || 5 * 1024 * 1024; 

    if (file.size > maxSize) {
      console.warn('❌ File too large:', file.size, 'Max:', maxSize);
      return false;
    }

    return true;
  }

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
