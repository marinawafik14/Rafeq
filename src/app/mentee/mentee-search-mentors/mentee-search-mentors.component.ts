import { Component, OnInit } from '@angular/core';
import { MentorSearchService, MentorSearchFilters, MentorSearchResult } from '../../Services/mentor-search.service';
import { Skills } from '../../Models/Skills';
import { Users } from '../../Models/Users';
import { SkillService } from '../../Services/skill.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MentorCard, MenteeService } from '../../Services/Mentee.service';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../Services/auth.service';
import { SemanticMentorResult } from '../../Models/SemanticMentorResult';

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
  menteeId: number | null = null;
  allMentors: MentorCard[] = [];

  aiSearchMode = false;
  semanticQuery = '';
  semanticMentors: SemanticMentorResult[] = [];
  semanticLoading = false;
  semanticTotal = 0;
  semanticSearchTime = 0;

  constructor(
    private mentorSearchService: MentorSearchService,
    private skillService: SkillService,
    private menteeService: MenteeService,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) { }

  onImageError(event: any) {
    event.target.src = '/images/default-avatar.png';
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.menteeId = this.authService.getCurrentUserId();
      
      if (!this.menteeId) {
        console.warn('No menteeId available');
      }

      this.loadSkills();
      this.fetchAllMentors();
    });
  }

  viewMentorProfile(mentorId: number) {
    if (!this.menteeId) {
      this.menteeId = this.authService.getCurrentUserId();
    }

    if (this.menteeId) {
      this.router.navigate(['/mentee/mentor', mentorId]);
    } else {
      this.router.navigate(['/mentee/mentor', mentorId]);
    }
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
            skills: (m.mentorSkills || []).map((skill: any) => ({
              Name: skill.name,
              id: skill.id
            })),
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

    this.total = filtered.length;

    // Pagination
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.mentors = filtered.slice(start, end);

    this.emptyState = filtered.length === 0;
  }

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

  toggleSearchMode(mode: 'normal' | 'ai') {
    this.aiSearchMode = (mode === 'ai');
    this.clearAllFilters();
    this.semanticQuery = '';
    this.semanticMentors = [];
    this.semanticTotal = 0;
  }

  onSemanticSearch() {
    if (!this.semanticQuery.trim()) return;

    // Debug: Log auth info
    console.debug('isLoggedIn:', this.authService.isLoggedIn());
    console.debug('userRole:', this.authService.getCurrentUserRole());

    const isLoggedIn = this.authService.isLoggedIn();
    const userRole = this.authService.getCurrentUserRole();
    if (!isLoggedIn || userRole !== 'Mentee') {
      console.warn('Semantic search is restricted to authenticated mentees only.');
      this.semanticMentors = [];
      this.semanticTotal = 0;
      this.semanticLoading = false;
      this.emptyState = true;
      alert('You must be logged in as a mentee to use AI semantic search.');
      return;
    }

    this.semanticLoading = true;
    const skills = this.getSelectedSkills().map(s => s.Name);
    const maxResults = 3; // Use current page size for maxResults

    // Debug: Log request payload
    console.debug('Semantic search request:', {
      query: this.semanticQuery,
      minRating: this.minRating || undefined,
      maxHourlyRate: this.maxPrice || undefined,
      skills,
      maxResults
    });

    this.mentorSearchService.semanticMentorSearch(
      this.semanticQuery,
      this.minRating || undefined,
      this.maxPrice || undefined,
      skills,
      maxResults
    ).subscribe({
      next: res => {
        // Debug: Log response
        console.debug('Semantic search response:', res);
        this.semanticMentors = res.mentors;
        this.semanticTotal = res.totalResults;
        this.semanticSearchTime = res.searchTime;
        this.semanticLoading = false;
        this.emptyState = res.mentors.length === 0;
      },
      error: err => {
        // Debug: Log error
        console.error('Semantic search error:', err);
        this.semanticMentors = [];
        this.semanticTotal = 0;
        this.semanticLoading = false;
        this.emptyState = true;
        // Do NOT fallback to normal search
      }
    });
  }

  // TrackBy functions 
  trackBySkillId(index: number, skill: Skills): number {
    return skill.SkillId;
  }

  trackByMentorId(index: number, mentor: MentorCard): number {
    return mentor.userId;
  }

  trackBySkillName(index: number, skill: any): string {
    return skill.Name;
  }

  trackBySemanticMentorId(index: number, mentor: SemanticMentorResult): number {
    return mentor.userId;
  }
}
