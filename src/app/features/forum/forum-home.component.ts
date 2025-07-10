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
