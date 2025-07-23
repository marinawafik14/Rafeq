import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ArticleListDto, PagedResult } from '../../Models/articles/ArticleDto';
import { ArticlesService } from '../../Services/articles.service';
import { ScrollPositionService } from '../../Services/scroll-position.service';

@Component({
  selector: 'app-articles-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './articles-list.component.html',
  styleUrl: './articles-list.component.css',
})
export class ArticlesListComponent implements OnInit {
  articles: ArticleListDto[] = [];
  searchQuery: string = '';
  currentCategoryFilter: string | undefined;
  loading: boolean = true;

  currentPage: number = 1;
  pageSize: number = 6; 
  totalArticles: number = 0; 
  totalPages: number = 0;

  constructor(
    private articlesService: ArticlesService,
    private toastr: ToastrService,
    private route: ActivatedRoute,
    private router: Router,
    private scrollPositionService: ScrollPositionService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.currentCategoryFilter = params['category'] || undefined;
      this.currentPage = Number(params['page']) || 1;
      this.searchQuery = params['search'] || ''; 

      this.loadArticles(); 
    });

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
        this.searchQuery
      )
      .subscribe({
        next: (pagedResult: PagedResult<ArticleListDto>) => {
          this.articles = pagedResult.items;
          this.totalArticles = pagedResult.totalCount;
          this.totalPages = pagedResult.totalPages;
          this.loading = false;
        },
        error: (err: any) => {
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
      queryParams: { category: category || null, page: 1 }, 
      queryParamsHandling: 'merge', 
    });
  }

  onSearch(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { search: this.searchQuery || null, page: 1 }, 
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

  get pagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  onArticleClick(): void {
    const currentScrollPosition =
      this.scrollPositionService.getCurrentScrollPosition();
    this.scrollPositionService.saveScrollPosition(
      '/articles',
      currentScrollPosition
    );
  }
}
