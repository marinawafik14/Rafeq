// src/app/Components/Admin/admin-articles/article-form/article-form.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { UserDto } from '../../Models/articles/UserDto';
import { ArticlesService } from '../../Services/articles.service';
import { UserFAService } from '../../Services/user-fa.service';
import { ArticleDto } from '../../Models/articles/ArticleDto';
import { ArticleCreateUpdateDto } from '../../Models/articles/ArticleCreateUpdateDto';


@Component({
  selector: 'app-article-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './article-form.component.html',
  styleUrls: ['./article-form.component.css']
})
export class ArticleFormComponent implements OnInit {
  articleForm!: FormGroup;
  isEditMode: boolean = false;
  articleId: number | null = null;
  loading: boolean = false;
  authors: UserDto[] = []; // To hold a list of potential authors

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private articlesService: ArticlesService,
    private toastr: ToastrService,
    private userFAService: UserFAService // Renamed injection
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.loadAuthors(); // Load authors when component initializes

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.articleId = +id;
        this.loadArticleData(this.articleId);
      }
    });
  }

  initializeForm(): void {
    this.articleForm = this.fb.group({
      title: ['', Validators.required],
      summary: [''],
      content: ['', Validators.required],
      category: [''],
      isPublished: [true],
      authorId: [null, Validators.required]
    });
  }

  loadAuthors(): void {
    this.userFAService.getAllUsersForAdmin().subscribe({ // Renamed service call
      next: (pagedResult) => {
        this.authors = pagedResult.items;
      },
      error: (err) => {
        this.toastr.error('Failed to load authors. Please check console.', 'Error');
        console.error('Error loading authors:', err);
      }
    });
  }

  loadArticleData(id: number): void {
    this.loading = true;
    this.articlesService.getArticleByIdForAdmin(id).subscribe({
      next: (article: ArticleDto) => {
        this.articleForm.patchValue({
          title: article.title,
          summary: article.summary,
          content: article.content,
          category: article.category,
          isPublished: article.isPublished,
          authorId: article.authorId
        });
        this.loading = false;
      },
      error: (err: any) => {
        this.toastr.error(err.message || 'Failed to load article for editing.', 'Error');
        console.error('Error loading article:', err);
        this.loading = false;
        this.router.navigate(['/admin/articles']);
      }
    });
  }

  onSubmit(): void {
    if (this.articleForm.invalid) {
      this.toastr.warning('Please fill in all required fields correctly.', 'Validation Error');
      this.articleForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const articleData: ArticleCreateUpdateDto = this.articleForm.value;

    if (this.isEditMode && this.articleId) {
      this.articlesService.updateArticle(this.articleId, articleData).subscribe({
        next: () => {
          this.toastr.success('Article updated successfully!', 'Success');
          this.router.navigate(['/admin/articles']);
        },
        error: (err: any) => {
          this.toastr.error(err.message || 'Failed to update article.', 'Error');
          console.error('Error updating article:', err);
          this.loading = false;
        }
      });
    } else {
      this.articlesService.createArticle(articleData).subscribe({
        next: () => {
          this.toastr.success('Article created successfully!', 'Success');
          this.router.navigate(['/admin/articles']);
        },
        error: (err: any) => {
          this.toastr.error(err.message || 'Failed to create article.', 'Error');
          console.error('Error creating article:', err);
          this.loading = false;
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/admin/articles']);
  }
}
