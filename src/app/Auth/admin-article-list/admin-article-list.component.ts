import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { ArticleListDto, PagedResult } from '../../Models/articles/ArticleDto';
import { ArticlesService } from '../../Services/articles.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-article-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-article-list.component.html',
  styleUrls: ['./admin-article-list.component.css'],
})
export class AdminArticleListComponent implements OnInit, OnDestroy {
  articles: ArticleListDto[] = [];
  pagedResult: PagedResult<ArticleListDto> | null = null;
  pageNumber: number = 1;
  pageSize: number = 10;
  searchQuery: string = '';
  category: string = '';
  loading: boolean = false;
  error: string | null = null;
  Math = Math; // Expose Math to template

  // Subjects for automatic filtering
  private searchSubject = new Subject<string>();
  private categorySubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private articlesService: ArticlesService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.setupAutoFiltering();
    this.loadArticles();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setupAutoFiltering(): void {
    // Auto-filter on search input with debounce
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageNumber = 1;
        this.loadArticles();
      });

    // Auto-filter on category input with debounce
    this.categorySubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageNumber = 1;
        this.loadArticles();
      });
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery = target.value;
    this.searchSubject.next(this.searchQuery);
  }

  onCategoryInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.category = target.value;
    this.categorySubject.next(this.category);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchSubject.next(this.searchQuery);
  }

  clearCategory(): void {
    this.category = '';
    this.categorySubject.next(this.category);
  }

  clearAllFilters(): void {
    this.searchQuery = '';
    this.category = '';
    this.pageNumber = 1;
    this.loadArticles();
  }

  trackByArticleId(index: number, article: ArticleListDto): number {
    return article.articleId;
  }

  loadArticles(): void {
    this.loading = true;
    this.error = null;
    this.articlesService
      .getAllArticlesForAdmin(
        this.pageNumber,
        this.pageSize,
        this.category,
        this.searchQuery
      )
      .subscribe({
        next: (data: PagedResult<ArticleListDto>) => {
          this.pagedResult = data;
          this.articles = data.items;
          this.loading = false;
        },
        error: (err: any) => {
          console.error('Error loading articles for admin:', err);
          this.error =
            'Failed to load articles. Please check console for details.';
          this.toastr.error(err.message || 'Failed to load articles.', 'Error');
          this.loading = false;
        },
      });
  }

  onPageChange(newPage: number): void {
    if (
      this.pagedResult &&
      newPage >= 1 &&
      newPage <= this.pagedResult.totalPages
    ) {
      this.pageNumber = newPage;
      this.loadArticles();
    }
  }

  deleteArticle(id: number): void {
    const article = this.articles.find((a) => a.articleId === id);
    const articleTitle = article ? article.title : 'this article';

    Swal.fire({
      title: 'Delete Article?',
      text: `Are you sure you want to delete "${articleTitle}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-4',
        confirmButton: 'rounded-pill px-4',
        cancelButton: 'rounded-pill px-4'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.articlesService.deleteArticle(id).subscribe({
          next: () => {
            this.loadArticles();
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: `Article "${articleTitle}" has been deleted.`,
              timer: 1500,
              showConfirmButton: false,
              toast: true,
              position: 'top-end'
            });
          },
          error: (err: any) => {
            console.error('Error deleting article:', err);
            Swal.fire({
              icon: 'error',
              title: 'Failed to Delete',
              text: err.message || 'Unknown error',
              confirmButtonColor: '#0a2e65'
            });
          },
        });
      }
    });
  }

  get totalPagesArray(): number[] {
    if (!this.pagedResult) return [];
    return Array.from({ length: this.pagedResult.totalPages }, (_, i) => i + 1);
  }
}
