import { Component, OnInit } from '@angular/core';
import { MentorSearchService, MentorSearchFilters, MentorSearchResult } from '../../Services/mentor-search.service';
import { Skills } from '../../Models/Skills';
import { Users } from '../../Models/Users';
import { SkillService } from '../../Services/skill.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MentorCard, MenteeService } from '../../Services/Mentee.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-mentee-search-mentors',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mentee-search-mentors.component.html',
  styleUrls: ['./mentee-search-mentors.component.css']
})
export class MenteeSearchMentorsComponent implements OnInit {
  mentors: MentorCard[] = [];
  total = 0;
  skills: Skills[] = [];
  filteredSkills: Skills[] = [];
  skillSearchTerm = '';
  searchName = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  minRating: number | null = null;
  sortBy = 'rating';
  pageSize = 6;
  currentPage = 1;
  
  filters: MentorSearchFilters = {
    skills: [],
    minPrice: undefined,
    maxPrice: undefined,
    minRating: undefined,
    sortBy: 'rating',
    sortOrder: 'desc',
    page: 1,
    pageSize: 6
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
    private router: Router,
    private route: ActivatedRoute
  ) {}

  // Handle image error
  onImageError(event: any) {
    event.target.src = '/images/default-avatar.png';
  }

  ngOnInit() {
    // Try to get menteeId from route first
    this.route.paramMap.subscribe(params => {
      const routeMenteeId = params.get('menteeId');
      if (routeMenteeId) {
        this.menteeId = +routeMenteeId;
        console.log('MenteeId from route:', this.menteeId); // Debug log
      } else {
        // If no menteeId from route, get from token as fallback
        const token = document.cookie.split('; ').find(row => row.startsWith('authToken='))?.split('=')[1];
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            this.menteeId = payload.menteeId || payload.userId || null;
            console.log('MenteeId from token:', this.menteeId); // Debug log
          } catch (e) {
            console.error('Failed to parse token:', e);
          }
        }
      }

      // Log final menteeId value
      console.log('Final menteeId in search component:', this.menteeId);
      
      // If still no menteeId, log warning
      if (!this.menteeId) {
        console.warn('No menteeId available in search-mentors component');
      }

      // Load data after menteeId is determined
      this.loadSkills();
      this.fetchAllMentors();
    });
  }

  loadSkills() {
    console.log('Loading skills from API...');
    this.skillService.getAllSkillsForMentee().subscribe({
      next: (skills) => {
        console.log('Skills loaded successfully:', skills);
        this.skills = skills;
        this.filteredSkills = [...skills];
        console.log('Skills array length:', this.skills.length);
        console.log('Filtered skills array length:', this.filteredSkills.length);
      },
      error: (error) => {
        console.error('Error loading skills:', error);
        this.skills = [];
        this.filteredSkills = [];
      }
    });
  }

  filterSkills() {
    if (!this.skillSearchTerm.trim()) {
      this.filteredSkills = [...this.skills];
    } else {
      this.filteredSkills = this.skills.filter(skill => 
        skill.Name.toLowerCase().includes(this.skillSearchTerm.toLowerCase())
      );
    }
  }

  isSkillSelected(skillId: number): boolean {
    return this.filters.skills?.includes(skillId) || false;
  }

  getSelectedSkills(): Skills[] {
    return this.skills.filter(skill => this.filters.skills?.includes(skill.SkillId));
  }

  removeSkillFilter(skillId: number) {
    this.filters.skills = this.filters.skills?.filter(id => id !== skillId) || [];
    this.filters.page = 1;
    this.currentPage = 1;
    this.applyFilters();
  }

  clearSkillFilters() {
    this.filters.skills = [];
    this.filters.page = 1;
    this.currentPage = 1;
    this.applyFilters();
  }

  onSearchChange() {
    this.filters.page = 1;
    this.currentPage = 1;
    this.applyFilters();
  }

  clearSearch() {
    this.searchName = '';
    this.filters.page = 1;
    this.currentPage = 1;
    this.applyFilters();
  }

  onPageSizeChange() {
    this.filters.pageSize = this.pageSize;
    this.filters.page = 1;
    this.currentPage = 1;
    this.applyFilters();
  }

  clearAllFilters() {
    this.skillSearchTerm = '';
    this.searchName = '';
    this.minPrice = null;
    this.maxPrice = null;
    this.minRating = null;
    this.sortBy = 'rating';
    this.filters = {
      skills: [],
      minPrice: undefined,
      maxPrice: undefined,
      minRating: undefined,
      sortBy: 'rating',
      sortOrder: 'desc',
      page: 1,
      pageSize: this.pageSize
    };
    this.currentPage = 1;
    this.filteredSkills = [...this.skills];
    this.applyFilters();
  }

  clearPriceFilter(type: 'min' | 'max') {
    if (type === 'min') {
      this.minPrice = null;
      this.filters.minPrice = undefined;
    } else {
      this.maxPrice = null;
      this.filters.maxPrice = undefined;
    }
    this.filters.page = 1;
    this.currentPage = 1;
    this.applyFilters();
  }

  clearRatingFilter() {
    this.minRating = null;
    this.filters.minRating = undefined;
    this.filters.page = 1;
    this.currentPage = 1;
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return !!(
      this.searchName ||
      this.minPrice ||
      this.maxPrice ||
      this.minRating ||
      (this.filters.skills && this.filters.skills.length > 0)
    );
  }

  hasActiveSearch(): boolean {
    return !!this.searchName;
  }

  getActiveFiltersCount(): number {
    let count = 0;
    if (this.searchName) count++;
    if (this.minPrice) count++;
    if (this.maxPrice) count++;
    if (this.minRating) count++;
    if (this.filters.skills && this.filters.skills.length > 0) count += this.filters.skills.length;
    return count;
  }

  refresh() {
    this.fetchAllMentors();
  }

  // Pagination computed properties
  get totalItems(): number {
    return this.total;
  }

  get totalPages(): number {
    return Math.ceil(this.total / this.pageSize);
  }

  get startItem(): number {
    return this.total === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage * this.pageSize, this.total);
  }

  get visiblePages(): number[] {
    return this.getPaginationRange(this.currentPage, this.totalPages);
  }

  get showFirstPage(): boolean {
    return this.currentPage > 3;
  }

  get showLastPage(): boolean {
    return this.currentPage < this.totalPages - 2;
  }

  get showStartDots(): boolean {
    return this.currentPage > 4;
  }

  get showEndDots(): boolean {
    return this.currentPage < this.totalPages - 3;
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.filters.page = page;
      this.applyFilters();
    }
  }

  getPaginationRange(currentPage: number, totalPages: number): number[] {
    const range: number[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        range.push(i);
      }
    } else {
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, start + maxVisible - 1);
      
      for (let i = start; i <= end; i++) {
        range.push(i);
      }
    }
    
    return range;
  }

  fetchAllMentors() {
    this.isLoading = true;
    console.log('Fetching all mentors from API...');
    this.menteeService.getAllMentors().subscribe({
      next: (mentors: any[]) => {
        console.log('Raw mentor data from API:', mentors);
        this.allMentors = mentors.map(m => {
          console.log('Processing mentor:', m.fullName, 'mentorSkills:', m.mentorSkills, 'skills:', m.skills);
          return {
            id: m.id,
            userId: m.userId,
            fullName: m.fullName,
            email: m.email,
            role: m.role || null,
            profilePicture: m.profilePicture,
            bio: m.bio,
            hourlyRate: m.hourlyRate,
            // Use mentorSkills from backend, transform to match expected format
            skills: (m.mentorSkills || []).map((skill: any) => ({
              Name: skill.name,
              id: skill.id
            })),
            // Keep original mentorSkills and skills arrays for reference
            mentorSkills: m.mentorSkills || [],
            skillsArray: m.skills || [],
            availabilities: m.availabilities || [],
            rating: m.rating ?? null,
            isMentor: m.isMentor ?? true,
            isInterviewer: m.isInterviewer ?? false
          };
        });
        console.log('Processed mentors:', this.allMentors);
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching mentors:', error);
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
    
    // Name search filter
    if (this.searchName && this.searchName.trim()) {
      filtered = filtered.filter(m => 
        m.fullName.toLowerCase().includes(this.searchName.toLowerCase())
      );
    }
    
    // Skills filter
    if (this.filters.skills && this.filters.skills.length > 0) {
      // Get selected skill names from the Skills list
      const selectedSkillNames = this.skills
        .filter(skill => this.filters.skills!.includes(skill.SkillId))
        .map(skill => skill.Name);
      filtered = filtered.filter(m => m.skills.some(s => selectedSkillNames.includes(s.Name)));
    }
    
    // Price filter
    if (this.minPrice !== null && this.minPrice !== undefined) {
      filtered = filtered.filter(m => m.hourlyRate >= this.minPrice!);
    }
    if (this.maxPrice !== null && this.maxPrice !== undefined) {
      filtered = filtered.filter(m => m.hourlyRate <= this.maxPrice!);
    }
    
    // Rating filter
    if (this.minRating !== null && this.minRating !== undefined) {
      filtered = filtered.filter(m => (m.rating ?? 0) >= this.minRating!);
    }
    
    // Sort
    if (this.sortBy === 'price') {
      filtered = filtered.sort((a, b) => (this.filters.sortOrder === 'asc' ? a.hourlyRate - b.hourlyRate : b.hourlyRate - a.hourlyRate));
    } else if (this.sortBy === 'rating') {
      filtered = filtered.sort((a, b) => (this.filters.sortOrder === 'asc' ? (a.rating ?? 0) - (b.rating ?? 0) : (b.rating ?? 0) - (a.rating ?? 0)));
    } else if (this.sortBy === 'name') {
      filtered = filtered.sort((a, b) => a.fullName.localeCompare(b.fullName));
    }
    
    // Update total before pagination
    this.total = filtered.length;
    
    // Pagination
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.mentors = filtered.slice(start, end);
    
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
    this.currentPage = 1;
    this.applyFilters();
  }

  onMinPriceChange(event: Event) {
    const min = (event.target as HTMLInputElement).valueAsNumber;
    this.minPrice = isNaN(min) ? null : min;
    this.filters.minPrice = this.minPrice || undefined;
    this.filters.page = 1;
    this.currentPage = 1;
    this.applyFilters();
  }

  onMaxPriceChange(event: Event) {
    const max = (event.target as HTMLInputElement).valueAsNumber;
    this.maxPrice = isNaN(max) ? null : max;
    this.filters.maxPrice = this.maxPrice || undefined;
    this.filters.page = 1;
    this.currentPage = 1;
    this.applyFilters();
  }

  onRatingChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.minRating = value ? +value : null;
    this.filters.minRating = this.minRating || undefined;
    this.filters.page = 1;
    this.currentPage = 1;
    this.applyFilters();
  }

  onSortChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.sortBy = value;
    this.filters.sortBy = value;
    this.filters.page = 1;
    this.currentPage = 1;
    this.applyFilters();
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.filters.page = page;
    this.applyFilters();
  }

  toggleView(mode: 'list' | 'grid') {
    this.viewMode = mode;
  }

  viewMentorProfile(mentorId: number) {
    console.log('Viewing mentor profile:', { mentorId, menteeId: this.menteeId }); // Debug log
    
    // Try to get menteeId if not available
    if (!this.menteeId) {
      const token = document.cookie.split('; ').find(row => row.startsWith('authToken='))?.split('=')[1];
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          this.menteeId = payload.menteeId || payload.userId || null;
          console.log('Retrieved menteeId from token in viewMentorProfile:', this.menteeId);
        } catch (e) {
          console.error('Failed to parse token in viewMentorProfile:', e);
        }
      }
    }
    
    if (this.menteeId) {
      // Always prefer the route with menteeId
      console.log('Navigating to:', ['/mentee', this.menteeId, 'mentor', mentorId]);
      this.router.navigate(['/mentee', this.menteeId, 'mentor', mentorId]);
    } else {
      console.warn('No menteeId available, using fallback route');
      // Fallback to route without menteeId
      this.router.navigate(['/mentee/mentor', mentorId]);
    }
  }

  // TrackBy functions for better performance
  trackBySkillId(index: number, skill: Skills): number {
    return skill.SkillId;
  }

  trackByMentorId(index: number, mentor: MentorCard): number {
    return mentor.userId;
  }

  trackBySkillName(index: number, skill: any): string {
    return skill.Name;
  }
}
