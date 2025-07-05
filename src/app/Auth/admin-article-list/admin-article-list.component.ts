import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ArticleListDto, PagedResult } from '../../Models/articles/ArticleDto';
import { ArticlesService } from '../../Services/articles.service';

@Component({
  selector: 'app-admin-article-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-article-list.component.html',
  styleUrls: ['./admin-article-list.component.css']
})
export class AdminArticleListComponent implements OnInit {
  articles: ArticleListDto[] = [];
  pagedResult: PagedResult<ArticleListDto> | null = null;
  pageNumber: number = 1;
  pageSize: number = 10; // Admin page size
  searchQuery: string = '';
  category: string = '';
  loading: boolean = false;
  error: string | null = null;

  constructor(private articlesService: ArticlesService, private toastr: ToastrService) { }

  ngOnInit(): void {
    this.loadArticles();
  }

  loadArticles(): void {
    this.loading = true;
    this.error = null;
    this.articlesService.getAllArticlesForAdmin(this.pageNumber, this.pageSize, this.category, this.searchQuery)
      .subscribe({
        next: (data: PagedResult<ArticleListDto>) => {
          this.pagedResult = data;
          this.articles = data.items;
          this.loading = false;
        },
        error: (err: any) => {
          console.error('Error loading articles for admin:', err);
          this.error = 'Failed to load articles. Please check console for details.';
          this.toastr.error(err.message || 'Failed to load articles.', 'Error');
          this.loading = false;
        }
      });
  }

  onPageChange(newPage: number): void {
    if (this.pagedResult && newPage >= 1 && newPage <= this.pagedResult.totalPages) {
      this.pageNumber = newPage;
      this.loadArticles();
    }
  }

  onSearch(): void {
    this.pageNumber = 1; // Reset to first page on new search
    this.loadArticles();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.category = '';
    this.pageNumber = 1;
    this.loadArticles();
  }

  deleteArticle(id: number): void {
    if (confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
      this.articlesService.deleteArticle(id).subscribe({
        next: () => {
          this.toastr.success('Article deleted successfully!', 'Success');
          this.loadArticles(); // Reload the list to reflect changes
        },
        error: (err: any) => {
          console.error('Error deleting article:', err);
          this.error = 'Failed to delete article. Please try again.';
          this.toastr.error(err.message || 'Failed to delete article.', 'Error');
        }
      });
    }
  }

  // Helper for pagination
  get totalPagesArray(): number[] {
    if (!this.pagedResult) return [];
    return Array.from({ length: this.pagedResult.totalPages }, (_, i) => i + 1);
  }
}
