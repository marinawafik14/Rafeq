import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ArticlesService } from '../../Services/articles.service';
import { ArticleDto } from '../../Models/articles/ArticleDto';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './article-detail.component.html',
  styleUrl: './article-detail.component.css'
})
export class ArticleDetailComponent implements OnInit {

  article: ArticleDto | null = null;
  loading: boolean = true;
  articleId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private articlesService: ArticlesService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.articleId = Number(params.get('id'));
      if (this.articleId) {
        this.loadArticle(this.articleId);
      } else {
        this.toastr.error('Article ID is missing.', 'Error');
        this.loading = false;
      }
    });
  }

   loadArticle(id: number): void {
    this.loading = true;
    this.articlesService.getArticleById(id).pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: (data: ArticleDto) => {
        this.article = data;
        this.articlesService.incrementViewCount(id).subscribe({
          next: () => {

            if (this.article) {
              this.article.viewCount++;
            }
          },
          error: (err) => {
            console.error('Error incrementing view count:', err);

          }
        });
      },
      error: (err: any) => { 
        this.toastr.error(err.message || 'Failed to load article.', 'Error');
        console.error('Error loading article:', err);
        this.article = null;
      }
    });
  }
}
