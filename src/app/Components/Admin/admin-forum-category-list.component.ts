import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ForumCategoryService } from '../../Services/forum-category.service';
import { ForumCategory } from '../../Models/Forum/forum-category.model';
import Swal from 'sweetalert2';
import { AuthService } from '../../Services/auth.service';

@Component({
  selector: 'app-admin-forum-category-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-forum-category-list.component.html',
  styleUrl: './admin-forum-category-list.component.css'
})
export class AdminForumCategoryListComponent implements OnInit {
  categories: ForumCategory[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private forumCategoryService: ForumCategoryService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn() || this.authService.getCurrentUserRole() !== 'Admin') {
      this.router.navigate(['/login']);
      return;
    }
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading = true;
    this.error = null;
    this.forumCategoryService.getAllCategories().subscribe({
      next: (data) => {
        this.categories = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load categories.';
        this.loading = false;
      }
    });
  }

  onEdit(category: ForumCategory): void {
    this.router.navigate(['/admin/forum/categories/edit', category.categoryId]);
  }

  onDelete(category: ForumCategory): void {
    Swal.fire({
      title: 'Delete Category?',
      text: `Are you sure you want to delete "${category.name}"? This action cannot be undone.`,
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
        this.forumCategoryService.deleteCategory(category.categoryId).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: `Category "${category.name}" has been deleted.`,
              timer: 1500,
              showConfirmButton: false,
              toast: true,
              position: 'top-end'
            });
            this.loadCategories();
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'Failed to Delete',
              text: err.message || 'Unknown error',
              confirmButtonColor: '#0a2e65'
            });
          }
        });
      }
    });
  }
}
