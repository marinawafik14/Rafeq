import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenteeLayoutComponent } from '../mentee-layout.component';
import { BookingService } from '../../Services/booking.service';

@Component({
  selector: 'app-mentee-bookings',
  standalone: true,
  imports: [CommonModule, MenteeLayoutComponent],
  templateUrl: './mentee-bookings.component.html',
  styleUrls: ['./mentee-bookings.component.css']
})
export class MenteeBookingsComponent implements OnInit {
  tab: 'upcoming' | 'past' | 'all' = 'upcoming';
  search = '';
  filterStatus: string = '';
  page = 1;
  pageSize = 5;
  bookings: any[] = [];

  constructor(private bookingService: BookingService) {}

  ngOnInit() {
    this.fetchAllBookings();
  }

  fetchAllBookings() {
    this.bookingService.getAllBookings().subscribe({
      next: (data) => this.bookings = data,
      error: _ => this.bookings = []
    });
  }

  setTab(tab: 'upcoming' | 'past' | 'all') {
    this.tab = tab;
    this.page = 1;
    this.search = '';
    this.filterStatus = '';
    // No need to refetch, just filter client-side
  }

  get filteredBookings() {
    const now = new Date();
    let filtered = this.bookings.filter(b => {
      const start = new Date(b.startDateTime);
      if (this.tab === 'upcoming') {
        return start > now;
      } else if (this.tab === 'past') {
        return start <= now;
      }
      return true; // 'all'
    });
    if (this.search) {
      filtered = filtered.filter(b => b.mentorName?.toLowerCase().includes(this.search.toLowerCase()));
    }
    if (this.filterStatus) {
      filtered = filtered.filter(b => b.status === this.filterStatus);
    }
    const startIdx = (this.page - 1) * this.pageSize;
    return filtered.slice(startIdx, startIdx + this.pageSize);
  }

  get totalFiltered() {
    const now = new Date();
    return this.bookings.filter(b => {
      const start = new Date(b.startDateTime);
      if (this.tab === 'upcoming') {
        return start > now;
      } else if (this.tab === 'past') {
        return start <= now;
      }
      return true;
    }).length;
  }

  onSearchChange(event: Event) {
    this.search = (event.target as HTMLInputElement).value;
    this.page = 1;
  }

  onFilterChange(event: Event) {
    this.filterStatus = (event.target as HTMLSelectElement).value;
    this.page = 1;
  }

  onPageChange(page: number) {
    this.page = page;
  }

  joinBooking(booking: any) {
    // TODO: Implement join logic
    alert('Joining session for ' + booking.mentor);
  }

  cancelBooking(booking: any) {
    // TODO: Implement cancel logic
    alert('Cancelling booking for ' + booking.mentor);
  }

  reviewBooking(booking: any) {
    // TODO: Implement review logic
    alert('Reviewing session for ' + booking.mentor);
  }

  bookingTabDate(booking: any): 'upcoming' | 'past' {
    const now = new Date();
    const start = new Date(booking.startDateTime);
    return start > now ? 'upcoming' : 'past';
  }
}
