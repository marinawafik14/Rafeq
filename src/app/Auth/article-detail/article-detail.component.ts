import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ArticleDto } from '../../Models/articles/ArticleDto';
import { ArticlesService } from '../../Services/articles.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-article-detail',
  imports: [CommonModule, RouterLink],
  templateUrl: './article-detail.component.html',
  styleUrl: './article-detail.component.css'
})
export class ArticleDetailComponent implements OnInit {

   article: ArticleDto | null = null;
  loading: boolean = true;


   constructor(
    private route: ActivatedRoute,
    private articlesService: ArticlesService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const articleId = Number(params.get('id'));
      if (articleId) {
        this.loadArticle(articleId);
      } else {
        this.toastr.error('Article ID is missing.', 'Error');
        this.loading = false;
      }
    });
  }

  loadArticle(id: number): void {
    this.loading = true;
    this.articlesService.getArticleById(id).subscribe({
      next: (data) => {
        this.article = data;
        this.loading = false;
      },
      error: (err) => {
        this.toastr.error(err.message || 'Failed to load article.', 'Error');
        console.error('Error loading article:', err);
        this.loading = false;
        this.article = null; // Ensure article is null on error/not found
      }
    });
  }

}
