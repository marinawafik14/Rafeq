import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ArticleDto, ArticleListDto } from '../../Models/articles/ArticleDto';
import { ArticlesService } from '../../Services/articles.service';
import { ScrollPositionService } from '../../Services/scroll-position.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-articles-list',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './articles-list.component.html',
  styleUrl: './articles-list.component.css',
})
export class ArticlesListComponent implements OnInit {
  articles: ArticleListDto[] = [];
  searchQuery: string = '';
  currentCategoryFilter: string | undefined;
  loading: boolean = true;

  // Pagination properties
  currentPage: number = 1;
  pageSize: number = 6; // Number of articles per page
  totalArticles: number = 0; // Total articles matching current filters (from backend)
  totalPages: number = 0;

  constructor(
    private articlesService: ArticlesService,
    private toastr: ToastrService,
    private route: ActivatedRoute,
    private router: Router,
    private scrollPositionService: ScrollPositionService
  ) {}

  ngOnInit(): void {
    // Subscribe to query parameters to react to changes in category, page, or search
    this.route.queryParams.subscribe((params) => {
      this.currentCategoryFilter = params['category'] || undefined;
      this.currentPage = Number(params['page']) || 1;
      this.searchQuery = params['search'] || ''; // Keep search query in sync with URL

      this.loadArticles(); // Reload articles based on new parameters
    });

    // Restore scroll position after component is fully loaded
    setTimeout(() => {
      const savedPosition =
        this.scrollPositionService.getScrollPosition('/articles');
      if (savedPosition > 0) {
        this.scrollPositionService.scrollToPosition(savedPosition);
        this.scrollPositionService.clearScrollPosition('/articles');
      }
    }, 200);
  }

  loadArticles(): void {
    this.loading = true;
    this.articlesService
      .getArticles(
        this.currentCategoryFilter,
        this.currentPage,
        this.pageSize,
        this.searchQuery // Pass search query to service
      )
      .subscribe({
        next: (pagedResult) => {
          this.articles = pagedResult.items;
          this.totalArticles = pagedResult.totalCount;
          this.totalPages = pagedResult.totalPages;
          this.loading = false;
        },
        error: (err) => {
          this.toastr.error(err.message || 'Failed to load articles.', 'Error');
          console.error('Error loading articles:', err);
          this.loading = false;
          this.articles = [];
          this.totalArticles = 0;
          this.totalPages = 0;
        },
      });
  }

  filterByCategory(category?: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category: category || null, page: 1 }, // Reset to page 1
      queryParamsHandling: 'merge', // Merge with existing params like search
    });
  }

  onSearch(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { search: this.searchQuery || null, page: 1 }, // Reset to page 1
      queryParamsHandling: 'merge',
    });
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { page: page },
        queryParamsHandling: 'merge',
      });
    }
  }

  // Helper to generate array for *ngFor in pagination
  get pagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  // Method to save scroll position before navigating to article detail
  onArticleClick(): void {
    const currentScrollPosition =
      this.scrollPositionService.getCurrentScrollPosition();
    this.scrollPositionService.saveScrollPosition(
      '/articles',
      currentScrollPosition
    );
  }
}
