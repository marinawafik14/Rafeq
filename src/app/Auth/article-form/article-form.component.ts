// src/app/Components/Admin/admin-articles/article-form/article-form.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { UserFADto } from '../../Models/articles/UserFADto';
import { ArticlesService } from '../../Services/articles.service';
import { UserFAService } from '../../Services/user-fa.service';
import { ArticleDto } from '../../Models/articles/ArticleDto';
import { ArticleCreateUpdateDto } from '../../Models/articles/ArticleCreateUpdateDto';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-article-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './article-form.component.html',
  styleUrls: ['./article-form.component.css'],
})
export class ArticleFormComponent implements OnInit {
  articleForm!: FormGroup;
  isEditMode: boolean = false;
  articleId: number | null = null;
  loading: boolean = false;
  authors: UserFADto[] = [];
  categories: string[] = ['Mentoring', 'Career', 'Interview', 'CV'];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private articlesService: ArticlesService,
    private toastr: ToastrService,
    private userFAService: UserFAService // Injected the renamed service
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadAuthors(); // Load authors when component initializes

    this.route.paramMap.subscribe((params) => {
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
      category: ['', Validators.required],
      isPublished: [true],
      authorId: [null],
    });
  }

  loadAuthors(): void {
    this.userFAService.getAllUsersForAdmin().subscribe({
      next: (pagedResult: { items: UserFADto[] }) => {
        this.authors = pagedResult.items;
      },
      error: (err: any) => {
        Swal.fire({
          icon: 'error',
          title: 'Failed to load authors',
          text: 'Please check console.',
          confirmButtonColor: '#0a2e65'
        });
        console.error('Error loading authors:', err);
      },
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
          authorId: article.authorId || null, // Handle undefined/null values properly
        });
        this.loading = false;
      },
      error: (err: any) => {
        Swal.fire({
          icon: 'error',
          title: 'Failed to load article for editing',
          text: err.message || 'Please check console.',
          confirmButtonColor: '#0a2e65'
        });
        console.error('Error loading article:', err);
        this.loading = false;
        this.router.navigate(['/admin/articles']);
      },
    });
  }

  onSubmit(): void {
    if (this.articleForm.invalid) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Please fill in all required fields correctly.',
        confirmButtonColor: '#0a2e65'
      });
      this.articleForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const formValue = this.articleForm.value;

    // Prepare article data, handle null authorId
    const articleData: ArticleCreateUpdateDto = {
      title: formValue.title,
      summary: formValue.summary,
      content: formValue.content,
      category: formValue.category,
      isPublished: formValue.isPublished,
    };

    // Only include authorId if it has a valid value
    if (formValue.authorId) {
      articleData.authorId = formValue.authorId;
    }

    if (this.isEditMode && this.articleId) {
      this.articlesService
        .updateArticle(this.articleId, articleData)
        .subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Article updated successfully!',
              timer: 1500,
              showConfirmButton: false,
              toast: true,
              position: 'top-end'
            });
            this.router.navigate(['/admin/articles']);
          },
          error: (err: any) => {
            Swal.fire({
              icon: 'error',
              title: 'Failed to update article',
              text: err.message || 'An error occurred.',
              confirmButtonColor: '#0a2e65'
            });
            console.error('Error updating article:', err);
            this.loading = false;
          },
        });
    } else {
      this.articlesService.createArticle(articleData).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Article created successfully!',
            timer: 1500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });
          this.router.navigate(['/admin/articles']);
        },
        error: (err: any) => {
          Swal.fire({
            icon: 'error',
            title: 'Failed to create article',
            text: err.message || 'An error occurred.',
            confirmButtonColor: '#0a2e65'
          });
          console.error('Error creating article:', err);
          this.loading = false;
        },
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/admin/articles']);
  }
}
