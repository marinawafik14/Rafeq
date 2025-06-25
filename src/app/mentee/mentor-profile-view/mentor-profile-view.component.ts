import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenteeLayoutComponent } from '../mentee-layout.component';
import { ActivatedRoute, Router } from '@angular/router';
import { MentorSearchService } from '../../Services/mentor-search.service';
import { MentorProfile } from '../../Models/mentor-profile';

@Component({
  selector: 'app-mentor-profile-view',
  standalone: true,
  imports: [CommonModule, FormsModule, MenteeLayoutComponent],
  templateUrl: './mentor-profile-view.component.html',
  styleUrls: ['./mentor-profile-view.component.css']
})
export class MentorProfileViewComponent implements OnInit {
  mentor: MentorProfile | null = null;
  mentorId: number | null = null;
  menteeId: number | null = null;
  
  // Pagination properties
  currentPage: number = 1;
  pageSize: number = 3;
  
  // Sorting properties
  sortBy: string = 'date';
  sortOrder: 'asc' | 'desc' = 'asc';
  
  // Layout properties
  availabilityOnLeft: boolean = true;

  constructor(
    private route: ActivatedRoute, 
    private mentorSearchService: MentorSearchService, 
    private router: Router
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const mentorId = params.get('id');
      const menteeId = params.get('menteeId');
      
      if (mentorId) {
        this.mentorId = +mentorId;
      }
      
      if (menteeId) {
        this.menteeId = +menteeId;
      }
      
      if (this.mentorId) {
        this.mentorSearchService.getMentorById(this.mentorId).subscribe({
          next: (data: MentorProfile) => this.mentor = data,
          error: (err: any) => {
            console.error('Error fetching mentor data:', err);
            this.mentor = null;
          }
        });
      }
    });
  }

  getDayName(dayOfWeek: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek] || 'Unknown';
  }

  getNextDateForDay(dayOfWeek: number): string {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    let daysUntilTarget = dayOfWeek - currentDay;
    
    // If the target day is today or in the past this week, get next week's occurrence
    if (daysUntilTarget <= 0) {
      daysUntilTarget += 7;
    }
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysUntilTarget);
    
    // Format as d-m-y
    const day = targetDate.getDate();
    const month = targetDate.getMonth() + 1; // getMonth() returns 0-11
    const year = targetDate.getFullYear();
    
    return `${day}-${month}-${year}`;
  }

  formatTime(time: string): string {
    if (!time) return '';
    
    // Convert 24-hour format to 12-hour format
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    
    return `${displayHour}:${minutes} ${ampm}`;
  }

  trackByDay(index: number, availability: any): any {
    return availability.availabilityId || index;
  }

  calculateWeeklyHours(availabilities: any[]): number {
    if (!availabilities) return 0;
    
    let totalHours = 0;
    availabilities.forEach(availability => {
      if (availability.startTime && availability.endTime) {
        const start = new Date(`1970-01-01T${availability.startTime}`);
        const end = new Date(`1970-01-01T${availability.endTime}`);
        const diffMs = end.getTime() - start.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        totalHours += diffHours;
      }
    });
    
    return Math.round(totalHours);
  }

  bookSession() {
    if (this.mentorId && this.menteeId) {
      this.router.navigate([`/mentee/${this.menteeId}/booking-form`], { 
        queryParams: { mentorId: this.mentorId } 
      });
    }
  }

  getSortedAvailabilities(): any[] {
    if (!this.mentor?.availabilities) return [];
    
    const sorted = [...this.mentor.availabilities].sort((a, b) => {
      let comparison = 0;
      
      switch (this.sortBy) {
        case 'date':
          const dateA = this.getDateForSorting(a.dayOfWeek);
          const dateB = this.getDateForSorting(b.dayOfWeek);
          comparison = dateA.getTime() - dateB.getTime();
          break;
        case 'day':
          comparison = a.dayOfWeek - b.dayOfWeek;
          break;
        case 'time':
          comparison = a.startTime.localeCompare(b.startTime);
          break;
      }
      
      return this.sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }

  getPaginatedAvailabilities(): any[] {
    const sorted = this.getSortedAvailabilities();
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return sorted.slice(startIndex, endIndex);
  }

  getDateForSorting(dayOfWeek: number): Date {
    const today = new Date();
    const currentDay = today.getDay();
    let daysUntilTarget = dayOfWeek - currentDay;
    
    if (daysUntilTarget <= 0) {
      daysUntilTarget += 7;
    }
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysUntilTarget);
    return targetDate;
  }

  getTotalPages(): number {
    return Math.ceil(this.getSortedAvailabilities().length / this.pageSize);
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const pages: number[] = [];
    
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  getStartIndex(): number {
    return (this.currentPage - 1) * this.pageSize;
  }

  getEndIndex(): number {
    const endIndex = this.currentPage * this.pageSize;
    const totalItems = this.getSortedAvailabilities().length;
    return Math.min(endIndex, totalItems);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1; // Reset to first page when page size changes
  }

  setSortBy(column: string): void {
    if (this.sortBy === column) {
      this.toggleSortOrder();
    } else {
      this.sortBy = column;
      this.sortOrder = 'asc';
    }
  }

  onSortChange(): void {
    this.currentPage = 1; // Reset to first page when sorting changes
  }

  toggleSortOrder(): void {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
  }

  toggleLayout(): void {
    this.availabilityOnLeft = !this.availabilityOnLeft;
  }
}
