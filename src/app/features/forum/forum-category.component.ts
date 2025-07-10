import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ForumService } from '../../Services/forum.service';
import { ForumPost } from '../../Models/Forum/forum-post.model';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-forum-category',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule], 
  templateUrl: './forum-category.component.html',
  styleUrl: './forum-category.component.css'
})
export class ForumCategoryComponent implements OnInit {
  posts: ForumPost[] = [];
  categoryId!: number;
  categoryName = '';
  isLoading = true;
  error: string | null = null;
  sortBy: string = 'recent';
  isSolved?: boolean;

  constructor(
    private forumService: ForumService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.categoryId = Number(params.get('categoryId'));
      this.loadPosts();
    });
  }

  loadPosts() {
    this.isLoading = true;
    this.error = null;
    this.forumService.getPostsByCategory(this.categoryId, this.sortBy, this.isSolved).subscribe({
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

  onSortChange(sort: string) {
    this.sortBy = sort;
    this.loadPosts();
  }

  onSolvedFilterChange(value: string) {
    if (value === '') {
      this.isSolved = undefined;
    } else if (value === 'true') {
      this.isSolved = true;
    } else if (value === 'false') {
      this.isSolved = false;
    }
    this.loadPosts();
  }

  goToCreatePost() {
    this.router.navigate(['/forum/create'], { queryParams: { categoryId: this.categoryId } });
  }
}
