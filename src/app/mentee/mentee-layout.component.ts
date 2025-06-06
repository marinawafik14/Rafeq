import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'mentee-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mentee-layout.component.html',
  styleUrls: ['./mentee-dashboard/mentee-dashboard.component.css']
})
export class MenteeLayoutComponent implements OnChanges {
  @Input() menteeName: string = '';
  @Input() menteeId: number | null = null;
  @Input() quickLinks = [
    { label: 'Dashboard', icon: 'bi-house', route: '/mentee/2/dashboard' },
    { label: 'Find Mentors', icon: 'bi-search', route: '/mentee/search-mentors' },
    { label: 'My Bookings', icon: 'bi-calendar', route: '/mentee/bookings' },
    { label: 'CV Management', icon: 'bi-file-earmark-text', route: '/mentee/cv-management' }
  ];

  ngOnChanges(changes: SimpleChanges): void {
    // This will trigger when menteeName or menteeId changes
    // You can add logic here if you want to react to changes
  }
}
