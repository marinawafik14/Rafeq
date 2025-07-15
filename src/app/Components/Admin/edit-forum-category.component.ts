import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ForumCategoryService } from '../../Services/forum-category.service';
import Swal from 'sweetalert2';
import { AuthService } from '../../Services/auth.service';

@Component({
  selector: 'app-edit-forum-category',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-forum-category.component.html',
  styleUrl: './edit-forum-category.component.css'
})
export class EditForumCategoryComponent implements OnInit {
  categoryForm: FormGroup;
  loading = false;
  categoryId!: number;

  constructor(
    private fb: FormBuilder,
    private forumCategoryService: ForumCategoryService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(200)]]
    });
  }

  ngOnInit(): void {
    if (!this.authService.isLoggedIn() || this.authService.getCurrentUserRole() !== 'Admin') {
      this.router.navigate(['/login']);
      return;
    }
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.categoryId = +id;
        this.loadCategory(this.categoryId);
      }
    });
  }

  loadCategory(id: number): void {
    this.loading = true;
    this.forumCategoryService.getAllCategories().subscribe({
      next: (categories) => {
        const category = categories.find(c => c.categoryId === id);
        if (category) {
          this.categoryForm.patchValue({
            name: category.name,
            description: category.description
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Not Found',
            text: 'Category not found.',
            confirmButtonColor: '#0a2e65'
          });
          this.router.navigate(['/admin/forum/categories']);
        }
        this.loading = false;
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.message || 'Failed to load category.',
          confirmButtonColor: '#0a2e65'
        });
        this.loading = false;
        this.router.navigate(['/admin/forum/categories']);
      }
    });
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Please fill in all required fields correctly.',
        confirmButtonColor: '#0a2e65'
      });
      this.categoryForm.markAllAsTouched();
      return;
    }
    this.loading = true;
    const { name, description } = this.categoryForm.value;
    this.forumCategoryService.updateCategory(this.categoryId, { name, description }).subscribe({
      next: (category) => {
        Swal.fire({
          icon: 'success',
          title: 'Category updated!',
          text: `Forum category "${category.name}" has been updated successfully.`,
          timer: 1500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
        this.router.navigate(['/admin/forum/categories']);
      },
      error: (err) => {
        let errorMsg = 'Failed to update category.';
        if (err?.error?.errors?.Name) {
          errorMsg = err.error.errors.Name.join(' ');
        } else if (err?.error?.message) {
          errorMsg = err.error.message;
        }
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: errorMsg,
          confirmButtonColor: '#0a2e65'
        });
        this.loading = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/admin/forum/categories']);
  }
}
