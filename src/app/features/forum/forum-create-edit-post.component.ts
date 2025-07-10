import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ForumService } from '../../Services/forum.service';
import { ForumCategory } from '../../Models/Forum/forum-category.model';
import { ForumPost } from '../../Models/Forum/forum-post.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-forum-create-edit-post',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forum-create-edit-post.component.html',
  styleUrl: './forum-create-edit-post.component.css'
})
export class ForumCreateEditPostComponent implements OnInit {
  categories: ForumCategory[] = [];
  post: Partial<ForumPost> = {};
  isEditMode = false;
  isLoading = false;
  error: string | null = null;
  success: string | null = null;

  constructor(
    private forumService: ForumService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.forumService.getCategories().subscribe({
      next: (cats) => (this.categories = cats),
      complete: () => (this.isLoading = false)
    });

    const postId = this.route.snapshot.paramMap.get('postId');
    const categoryId = this.route.snapshot.queryParamMap.get('categoryId');
    if (postId) {
      this.isEditMode = true;
      this.isLoading = true;
      this.forumService.getPostById(+postId).subscribe({
        next: (data) => {
          this.post = { ...data };
          this.isLoading = false;
        },
        error: (err) => {
          this.error = err.message || 'Failed to load post';
          this.isLoading = false;
        }
      });
    } else if (categoryId) {
      this.post.categoryId = +categoryId;
    }
  }

  onSubmit() {
    this.error = null;
    this.success = null;
    if (!this.post.title || !this.post.content || !this.post.categoryId) {
      this.error = 'Please fill in all required fields.';
      return;
    }
    this.isLoading = true;
    if (this.isEditMode && this.post.postId) {
      this.forumService.updatePost(this.post.postId, this.post).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Post updated!',
            timer: 1500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });
          this.router.navigate(['/forum/category', this.post.categoryId]);
        },
        error: (err) => {
          this.error = err.message || 'Failed to update post';
          this.isLoading = false;
        }
      });
    } else {
      this.forumService.createPost(this.post).subscribe({
        next: (created) => {
          this.success = 'Post created successfully!';
          this.router.navigate(['/forum/category', created.categoryId]);
        },
        error: (err) => {
          this.error = err.message || 'Failed to create post';
          this.isLoading = false;
        }
      });
    }
  }

  cancel() {
    this.router.navigate(['/forum']);
  }
}
