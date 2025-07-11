import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ForumService } from '../../Services/forum.service';
import { ForumPost } from '../../Models/Forum/forum-post.model';
import { ForumComment } from '../../Models/Forum/forum-comment.model';
import { ForumCommentFormComponent } from './forum-comment-form.component';
import { AuthService } from '../../Services/auth.service';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-forum-post-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ForumCommentFormComponent],
  templateUrl: './forum-post-detail.component.html',
  styleUrl: './forum-post-detail.component.css'
})
export class ForumPostDetailComponent implements OnInit {
  post: ForumPost | null = null;
  comments: ForumComment[] = [];
  isLoading = true;
  error: string | null = null;
  postId!: number;
  editingComment: ForumComment | null = null;
  isUpvoted = false; // Track if current user upvoted
  showReportForm = false;
  reportReason = '';

  constructor(
    private forumService: ForumService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('postId');
      if (id) {
        this.postId = +id;
        this.loadPost();
      }
    });
  }

  loadPost() {
    this.isLoading = true;
    this.error = null;
    this.forumService.getPostById(this.postId).subscribe({
      next: (post) => {
        this.post = post;
        this.forumService.getCommentsForPost(this.postId).subscribe({
          next: (comments) => {
            this.comments = comments;
            this.isLoading = false;
          },
          error: (err) => {
            this.error = err.message || 'Failed to load comments';
            this.comments = [];
            this.isLoading = false;
          }
        });
      },
      error: (err) => {
        this.error = err.message || 'Failed to load post';
        this.isLoading = false;
      }
    });
  }

  toggleUpvote() {
    if (!this.post) return;
    this.isLoading = true;
    const upvoteAction = this.isUpvoted
      ? this.forumService.removeUpvote(this.post.postId)
      : this.forumService.upvotePost(this.post.postId);
    upvoteAction.subscribe({
      next: () => {
        this.isUpvoted = !this.isUpvoted;
        this.loadPost();
      },
      error: (err) => {
        this.error = err.message || 'Failed to update upvote';
        this.isLoading = false;
      }
    });
  }

  openReportForm() {
    this.showReportForm = true;
    this.reportReason = '';
  }

  submitReport() {
    if (!this.post || !this.reportReason.trim()) return;
    this.isLoading = true;
    this.forumService.reportPost(this.post.postId, this.reportReason).subscribe({
      next: () => {
        this.showReportForm = false;
        this.isLoading = false;
        Swal.fire({
          icon: 'success',
          title: 'Report submitted!',
          text: 'Thank you for helping us keep the forum safe.',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      },
      error: (err) => {
        this.error = err.message || 'Failed to report post';
        this.isLoading = false;
      }
    });
  }

  cancelReport() {
    this.showReportForm = false;
    this.reportReason = '';
  }

  isPostOwner(): boolean {
    const user = this.authService.currentUserValue;
    return !!user && !!this.post && user.userId === this.post.userId;
  }

  markAsSolved() {
    if (!this.post) return;
    this.isLoading = true;
    this.forumService.markPostAsSolved(this.post.postId).subscribe({
      next: () => this.loadPost(),
      error: (err) => {
        this.error = err.message || 'Failed to mark as solved';
        this.isLoading = false;
      }
    });
  }

  editComment(comment: ForumComment) {
    this.editingComment = comment;
  }

  deleteComment(comment: ForumComment) {
    Swal.fire({
      title: 'Delete Comment?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading = true;
        this.forumService.deleteComment(comment.commentId).subscribe({
          next: () => {
            this.editingComment = null;
            this.loadPost();
            Swal.fire({
              icon: 'success',
              title: 'Comment Deleted!',
              timer: 1500,
              showConfirmButton: false,
              toast: true,
              position: 'top-end'
            });
          },
          error: (err) => {
            this.error = err.message || 'Failed to delete comment';
            this.isLoading = false;
            Swal.fire({
              icon: 'error',
              title: 'Failed to delete comment',
              text: this.error || undefined,
              confirmButtonColor: '#dc3545'
            });
          }
        });
      }
    });
  }

  onCommentAdded() {
    this.editingComment = null;
    this.loadPost();
  }
}
