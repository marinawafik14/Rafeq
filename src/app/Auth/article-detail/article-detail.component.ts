import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ArticlesService } from '../../Services/articles.service';
import { ArticleDto } from '../../Models/articles/ArticleDto';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './article-detail.component.html',
  styleUrl: './article-detail.component.css',
})
export class ArticleDetailComponent implements OnInit {
  article: ArticleDto | null = null;
  loading: boolean = true;
  articleId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private articlesService: ArticlesService,
    private sanitizer: DomSanitizer,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
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
    this.articlesService
      .getArticleById(id)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
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
            },
          });
        },
        error: (err: any) => {
          this.toastr.error(err.message || 'Failed to load article.', 'Error');
          console.error('Error loading article:', err);
          this.article = null;
        },
      });
  }

  formatArticleContent(content: string): SafeHtml {
    if (!content) return this.sanitizer.bypassSecurityTrustHtml('');

    // Replace markdown-style headers with styled headers
    let formatted = content
      // Format section titles (e.g., **1. Personalize It:**)
      .replace(
        /\*\*(\d+)\.\s+([^:]+):\*\*/g,
        '<h3 class="content-section-title"><span class="section-number">$1</span> $2</h3>'
      )
      // Format subsection titles (e.g., **This is important**)
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="highlight">$1</strong>')
      // Format italic text
      .replace(/\*([^*]+)\*/g, '<em class="emphasis">$1</em>')
      // Convert paragraphs (double newlines)
      .replace(/\n\n/g, '</p><p>')
      // Convert single newlines to line breaks
      .replace(/\n/g, '<br>');

    // Wrap the entire content in a paragraph if not already
    if (!formatted.startsWith('<p>')) {
      formatted = '<p>' + formatted;
    }
    if (!formatted.endsWith('</p>')) {
      formatted += '</p>';
    }

    return this.sanitizer.bypassSecurityTrustHtml(formatted);
  }
}
