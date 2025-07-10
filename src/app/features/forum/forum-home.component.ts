import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router'; 
import { ForumService } from '../../Services/forum.service';
import { ForumCategory } from '../../Models/Forum/forum-category.model';
import { ForumPost } from '../../Models/Forum/forum-post.model';

@Component({
  selector: 'app-forum-home',
  standalone: true,
  imports: [CommonModule, RouterLink], 
  templateUrl: './forum-home.component.html',
  styleUrl: './forum-home.component.css'
})
export class ForumHomeComponent implements OnInit {
  categories: ForumCategory[] = [];
  recentPosts: ForumPost[] = [];
  popularPosts: ForumPost[] = [];
  isLoading = true;
  error: string | null = null;

  // Pagination for recent posts
  recentPage = 1;
  recentPageSize = 5;
  get recentTotalPages(): number {
    return Math.ceil(this.recentPosts.length / this.recentPageSize);
  }
  get paginatedRecentPosts(): ForumPost[] {
    const start = (this.recentPage - 1) * this.recentPageSize;
    return this.recentPosts.slice(start, start + this.recentPageSize);
  }
  setRecentPage(page: number) {
    if (page >= 1 && page <= this.recentTotalPages) {
      this.recentPage = page;
    }
  }

  // Pagination for popular posts
  popularPage = 1;
  popularPageSize = 5;
  get popularTotalPages(): number {
    return Math.ceil(this.popularPosts.length / this.popularPageSize);
  }
  get paginatedPopularPosts(): ForumPost[] {
    const start = (this.popularPage - 1) * this.popularPageSize;
    return this.popularPosts.slice(start, start + this.popularPageSize);
  }
  setPopularPage(page: number) {
    if (page >= 1 && page <= this.popularTotalPages) {
      this.popularPage = page;
    }
  }

  constructor(private forumService: ForumService) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.error = null;
    this.forumService.getCategories().subscribe({
      next: (cats) => (this.categories = cats),
      error: (err) => (this.error = err.message || 'Failed to load categories')
    });
    this.forumService.getRecentPosts().subscribe({
      next: (posts) => (this.recentPosts = posts),
      error: (err) => (this.error = err.message || 'Failed to load posts'),
      complete: () => (this.isLoading = false)
    });
    this.forumService.getPopularPosts().subscribe({
      next: (posts) => (this.popularPosts = posts),
      error: (err) => (this.error = err.message || 'Failed to load posts')
    });
  }
}
