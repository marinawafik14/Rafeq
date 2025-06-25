import { Component, OnInit } from '@angular/core';
import { MentorSearchService, MentorSearchFilters, MentorSearchResult } from '../../Services/mentor-search.service';
import { Skills } from '../../Models/Skills';
import { Users } from '../../Models/Users';
import { SkillService } from '../../Services/skill.service';
import { CommonModule } from '@angular/common';
import { MenteeLayoutComponent } from '../mentee-layout.component';
import { MentorCard, MenteeService } from '../../Services/Mentee.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-mentee-search-mentors',
  standalone: true,
  imports: [CommonModule, MenteeLayoutComponent],
  templateUrl: './mentee-search-mentors.component.html',
  styleUrls: ['./mentee-search-mentors.component.css']
})
export class MenteeSearchMentorsComponent implements OnInit {
  mentors: MentorCard[] = [];
  total = 0;
  skills: Skills[] = [];
  filters: MentorSearchFilters = {
    skills: [],
    minPrice: undefined,
    maxPrice: undefined,
    minRating: undefined,
    sortBy: 'rating',
    sortOrder: 'desc',
    page: 1,
    pageSize: 8
  };
  viewMode: 'list' | 'grid' = 'grid';
  isLoading = false;
  emptyState = false;
  sortOptions = [
    { value: 'rating', label: 'Rating' },
    { value: 'price', label: 'Price' },
    { value: 'name', label: 'Name' }
  ];
  menteeId: number|null = null;
  allMentors: MentorCard[] = [];

  constructor(
    private mentorSearchService: MentorSearchService,
    private skillService: SkillService,
    private menteeService: MenteeService,
    private router: Router
  ) {}

  ngOnInit() {
    // Always get menteeId from the logged-in user's token for correct context
    const token = document.cookie.split('; ').find(row => row.startsWith('authToken='))?.split('=')[1];
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.menteeId = payload.menteeId || null;
      } catch {}
    }
    this.loadSkills();
    this.fetchAllMentors();
  }

  loadSkills() {
    this.skillService.getAllSkillsForMentee().subscribe(skills => this.skills = skills);
  }

  fetchAllMentors() {
    this.isLoading = true;
    this.menteeService.getAllMentors().subscribe({
      next: (mentors: any[]) => {
        this.allMentors = mentors.map(m => ({
          userId: m.userId,
          fullName: m.fullName,
          email: m.email,
          profilePicture: m.profilePicture,
          bio: m.bio,
          hourlyRate: m.hourlyRate,
          skills: m.skills || [],
          availabilities: m.availabilities || [],
          rating: m.rating ?? null
        }));
        this.applyFilters();
        this.isLoading = false;
      },
      error: _ => {
        this.allMentors = [];
        this.mentors = [];
        this.total = 0;
        this.emptyState = true;
        this.isLoading = false;
      }
    });
  }

  applyFilters() {
    let filtered = [...this.allMentors];
    // Skills filter
    if (this.filters.skills && this.filters.skills.length > 0) {
      // Get selected skill names from the Skills list
      const selectedSkillNames = this.skills
        .filter(skill => this.filters.skills!.includes(skill.SkillId))
        .map(skill => skill.Name);
      filtered = filtered.filter(m => m.skills.some(s => selectedSkillNames.includes(s.Name)));
    }
    // Price filter
    if (this.filters.minPrice !== undefined) {
      filtered = filtered.filter(m => m.hourlyRate >= this.filters.minPrice!);
    }
    if (this.filters.maxPrice !== undefined) {
      filtered = filtered.filter(m => m.hourlyRate <= this.filters.maxPrice!);
    }
    // Rating filter
    if (this.filters.minRating !== undefined) {
      filtered = filtered.filter(m => (m.rating ?? 0) >= this.filters.minRating!);
    }
    // Sort
    if (this.filters.sortBy === 'price') {
      filtered = filtered.sort((a, b) => (this.filters.sortOrder === 'asc' ? a.hourlyRate - b.hourlyRate : b.hourlyRate - a.hourlyRate));
    } else if (this.filters.sortBy === 'rating') {
      filtered = filtered.sort((a, b) => (this.filters.sortOrder === 'asc' ? (a.rating ?? 0) - (b.rating ?? 0) : (b.rating ?? 0) - (a.rating ?? 0)));
    } else if (this.filters.sortBy === 'name') {
      filtered = filtered.sort((a, b) => a.fullName.localeCompare(b.fullName));
    }
    // Pagination
    const start = ((this.filters.page ?? 1) - 1) * (this.filters.pageSize ?? 8);
    const end = start + (this.filters.pageSize ?? 8);
    this.mentors = filtered.slice(start, end);
    this.total = filtered.length;
    this.emptyState = filtered.length === 0;
  }

  // Update all filter triggers to use applyFilters
  onSkillChange(skillId: number, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.filters.skills!.push(skillId);
    } else {
      this.filters.skills = this.filters.skills!.filter(id => id !== skillId);
    }
    this.filters.page = 1;
    this.applyFilters();
  }

  onMinPriceChange(event: Event) {
    const min = (event.target as HTMLInputElement).valueAsNumber;
    this.filters.minPrice = isNaN(min) ? undefined : min;
    this.filters.page = 1;
    this.applyFilters();
  }

  onMaxPriceChange(event: Event) {
    const max = (event.target as HTMLInputElement).valueAsNumber;
    this.filters.maxPrice = isNaN(max) ? undefined : max;
    this.filters.page = 1;
    this.applyFilters();
  }

  onRatingChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.filters.minRating = value ? +value : undefined;
    this.filters.page = 1;
    this.applyFilters();
  }

  onSortChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.filters.sortBy = value;
    this.filters.page = 1;
    this.applyFilters();
  }

  onPageChange(page: number) {
    this.filters.page = page;
    this.applyFilters();
  }

  toggleView(mode: 'list' | 'grid') {
    this.viewMode = mode;
  }

  viewMentorProfile(mentorId: number) {
    if (this.menteeId) {
      this.router.navigate(['/mentee', this.menteeId, 'mentor', mentorId]);
    } else {
      // Fallback if menteeId is not available
      this.router.navigate(['/mentee/1/mentor', mentorId]);
    }
  }
}
