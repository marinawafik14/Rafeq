import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ForumCategoryService } from '../../Services/forum-category.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { AuthService } from '../../Services/auth.service';

@Component({
  selector: 'app-add-forum-category',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-forum-category.component.html',
  styleUrl: './add-forum-category.component.css'
})
export class AddForumCategoryComponent {
  categoryForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private forumCategoryService: ForumCategoryService,
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
    this.forumCategoryService.createCategory({ name, description }).subscribe({
      next: (category) => {
        Swal.fire({
          icon: 'success',
          title: 'Category created!',
          text: `Forum category "${category.name}" has been created successfully.`,
          timer: 1500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
        this.router.navigate(['/admin/forum/categories']);
      },
      error: (err) => {
        let errorMsg = 'Failed to create category.';
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
