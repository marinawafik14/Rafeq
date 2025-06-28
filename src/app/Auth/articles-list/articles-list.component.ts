import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ArticleDto } from '../../Models/articles/ArticleDto';
import { ArticlesService } from '../../Services/articles.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-articles-list',
  imports: [CommonModule, RouterLink, FormsModule ],
  templateUrl: './articles-list.component.html',
  styleUrl: './articles-list.component.css'
})
export class ArticlesListComponent implements OnInit {
 articles: ArticleDto[] = [];
  filteredArticles: ArticleDto[] = [];
  searchQuery: string = '';
  currentCategoryFilter: string | undefined;
  loading: boolean = true;



   constructor(
    private articlesService: ArticlesService,
    private toastr: ToastrService,
    private route: ActivatedRoute,
    private router: Router
  ) {}
  ngOnInit(): void {
 this.route.queryParams.subscribe(params => {
      this.currentCategoryFilter = params['category'] || undefined;
      this.loadArticles(this.currentCategoryFilter);
    });  }

loadArticles(category?: string): void {
    this.loading = true;
    this.articlesService.getArticles(category).subscribe({
      next: (data) => {
        this.articles = data;
        this.applyFilterAndSearch();
        this.loading = false;
      },
      error: (err) => {
        this.toastr.error(err.message || 'Failed to load articles.', 'Error');
        console.error('Error loading articles:', err);
        this.loading = false;
      }
    });
  }

  filterByCategory(category?: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category: category || null },
      queryParamsHandling: 'merge'
    });
  }

  onSearch(): void {
    this.applyFilterAndSearch();
  }

  private applyFilterAndSearch(): void {
    let tempArticles = [...this.articles];

    if (this.searchQuery) {
      const lowerCaseQuery = this.searchQuery.toLowerCase();
      tempArticles = tempArticles.filter(article =>
        article.title.toLowerCase().includes(lowerCaseQuery) ||
        article.summary?.toLowerCase().includes(lowerCaseQuery) ||
        article.content.toLowerCase().includes(lowerCaseQuery)
      );
    }
    this.filteredArticles = tempArticles;
  }
}
