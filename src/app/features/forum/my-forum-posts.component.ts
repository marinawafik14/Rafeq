import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ForumService } from '../../Services/forum.service';
import { ForumPost } from '../../Models/Forum/forum-post.model';
import { AuthService } from '../../Services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-my-forum-posts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-forum-posts.component.html',
  styleUrl: './my-forum-posts.component.css'
})
export class MyForumPostsComponent implements OnInit {
  posts: ForumPost[] = [];
  isLoading = true;
  error: string | null = null;
  currentUserId!: number;

  constructor(
    private forumService: ForumService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    if (!user) {
      this.error = 'You must be logged in to view your posts.';
      this.isLoading = false;
      return;
    }
    this.currentUserId = user.userId;
    this.loadPosts();
  }

  loadPosts() {
    this.isLoading = true;
    this.forumService.getPostsByUser(this.currentUserId).subscribe({
      next: (posts) => {
        this.posts = posts;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load your posts';
        this.isLoading = false;
      }
    });
  }

  editPost(post: ForumPost) {
    this.router.navigate(['/forum/edit', post.postId]);
  }

  deletePost(postId: number) {
    Swal.fire({
      title: 'Delete Post?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.forumService.deletePost(postId).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Post Deleted!',
              timer: 1500,
              showConfirmButton: false,
              toast: true,
              position: 'top-end'
            });
            this.loadPosts(); 
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'Failed to delete post',
              text: err.message || 'An error occurred while deleting the post',
              showConfirmButton: true,
              confirmButtonText: 'Close'
            });
          }
        });
      }
    });
  }
}
