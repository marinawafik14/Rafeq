import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { ForumService } from '../../Services/forum.service';
import { ForumPost } from '../../Models/Forum/forum-post.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-forum-pin',
  standalone: true,
  templateUrl: './admin-forum-pin.component.html',
  styleUrl: './admin-forum-pin.component.css',
  imports: [CommonModule] 
})
export class AdminForumPinComponent implements OnInit {
  posts: ForumPost[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(private forumService: ForumService) {}

  ngOnInit() {
    this.loadPosts();
  }

  loadPosts() {
    this.isLoading = true;
    this.forumService.getRecentPosts(100).subscribe({
      next: (posts) => {
        this.posts = posts;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load posts';
        this.isLoading = false;
      }
    });
  }

  pin(post: ForumPost) {
    this.forumService.pinPost(post.postId).subscribe({
      next: () => {
        post.isPinned = true;
        Swal.fire('Pinned!', 'Post has been pinned.', 'success');
      },
      error: () => Swal.fire('Error', 'Failed to pin post.', 'error')
    });
  }

  unpin(post: ForumPost) {
    this.forumService.unpinPost(post.postId).subscribe({
      next: () => {
        post.isPinned = false;
        Swal.fire('Unpinned!', 'Post has been unpinned.', 'success');
      },
      error: () => Swal.fire('Error', 'Failed to unpin post.', 'error')
    });
  }

  get pinnedCount(): number {
    return this.posts.filter(p => p.isPinned).length;
  }

  get totalCount(): number {
    return this.posts.length;
  }
}
