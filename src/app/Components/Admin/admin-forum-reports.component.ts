import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ForumService } from '../../Services/forum.service';
import { ForumReport } from '../../Models/Forum/forum-report.model';
import { ForumPost } from '../../Models/Forum/forum-post.model';
import { ForumComment } from '../../Models/Forum/forum-comment.model';

@Component({
  selector: 'app-admin-forum-reports',
  standalone: true,
  templateUrl: './admin-forum-reports.component.html',
  styleUrl: './admin-forum-reports.component.css',
  imports: [CommonModule],
  providers: [DatePipe]
})
export class AdminForumReportsComponent implements OnInit {
  reports: ForumReport[] = [];
  isLoading = false;
  error: string | null = null;
  selectedPost: (ForumPost & { comments: ForumComment[] }) | null = null;
  showPostModal = false;
  stats = { total: 0, pending: 0, resolved: 0, ignored: 0 };

  ngOnInit() {
    this.loadReports();
    this.loadStats();
  }

  constructor(private forumService: ForumService) {}

  get pendingCount(): number {
    return this.reports.filter(r => r.status?.toLowerCase() === 'pending').length;
  }
  get resolvedCount(): number {
    return this.reports.filter(r => r.status?.toLowerCase() === 'resolved').length;
  }
  get ignoredCount(): number {
    return this.reports.filter(r => r.status?.toLowerCase() === 'ignored').length;
  }

  loadReports() {
    this.isLoading = true;
    this.forumService.getForumReports().subscribe({
      next: (reports) => {
        this.reports = reports;
        this.isLoading = false;
        console.log('Loaded reports:', reports); // Debug: log reports to check status values
      },
      error: (err) => {
        this.error = err.message || 'Failed to load reports';
        this.isLoading = false;
      }
    });
  }

  loadStats() {
    this.forumService.getForumReportStats().subscribe({
      next: (stats) => this.stats = stats,
      error: () => this.stats = { total: 0, pending: 0, resolved: 0, ignored: 0 }
    });
  }

  takeAction(report: ForumReport, action: 'delete' | 'ignore') {
    this.forumService.takeForumReportAction(report.reportId, action, '').subscribe({
      next: () => {
        this.loadReports();
        this.loadStats(); // <-- Add this line to refresh stats and status
      },
      error: () => {
        alert('Failed to update report');
      }
    });
  }

  viewPost(postId: number) {
    this.forumService.getPostById(postId).subscribe({
      next: (post) => {
        this.selectedPost = post;
        this.showPostModal = true;
      },
      error: (err) => {
        if (err.status === 404) {
          alert('Post not found or has been deleted.');
        } else {
          alert('Failed to load post details.');
        }
      }
    });
  }

  closePostModal() {
    this.showPostModal = false;
    this.selectedPost = null;
  }

  getStatusLabel(status: string | null | undefined): string {
    if (!status) return 'Unknown';
    switch (status.toLowerCase()) {
      case 'pending': return 'Pending';
      case 'resolved': return 'Resolved';
      case 'ignored': return 'Ignored';
      default: return status;
    }
  }
}
