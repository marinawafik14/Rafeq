import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ForumCategory } from '../Models/Forum/forum-category.model';
import { ForumPost } from '../Models/Forum/forum-post.model';
import { ForumComment } from '../Models/Forum/forum-comment.model';
import { ForumReport } from '../Models/Forum/forum-report.model';
import { environment } from '../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class ForumService {
  private apiUrl = environment.apiUrl; 

  constructor(private http: HttpClient) {}

  getCategories(): Observable<ForumCategory[]> {
    return this.http.get<ForumCategory[]>(`${this.apiUrl}/forum/categories`);
  }

  getRecentPosts(limit: number = 5): Observable<ForumPost[]> {
    const params = new HttpParams().set('sortBy', 'recent');
    return this.http.get<ForumPost[]>(`${this.apiUrl}/forum/posts`, { params });
  }

  getPopularPosts(limit: number = 5): Observable<ForumPost[]> {
    const params = new HttpParams().set('sortBy', 'upvotes');
    return this.http.get<ForumPost[]>(`${this.apiUrl}/forum/posts`, { params });
  }

  getPostsByCategory(categoryId: number, sortBy: string = 'recent', isSolved?: boolean, search?: string): Observable<ForumPost[]> {
    let params = new HttpParams()
      .set('categoryId', categoryId)
      .set('sortBy', sortBy);
    if (isSolved !== undefined) params = params.set('isSolved', isSolved);
    if (search) params = params.set('search', search);
    return this.http.get<ForumPost[]>(`${this.apiUrl}/forum/posts`, { params });
  }

  getPostById(postId: number): Observable<ForumPost & { comments: ForumComment[] }> {
    return this.http.get<ForumPost & { comments: ForumComment[] }>(`${this.apiUrl}/forum/posts/${postId}`);
  }

  createPost(post: Partial<ForumPost>): Observable<ForumPost> {
    return this.http.post<ForumPost>(`${this.apiUrl}/forum/posts`, post);
  }

  updatePost(postId: number, post: Partial<ForumPost>): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/forum/posts/${postId}`, post);
  }

  deletePost(postId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/forum/posts/${postId}`);
  }

  getPostsByUser(userId: number): Observable<ForumPost[]> {
    return this.http.get<ForumPost[]>(`${this.apiUrl}/forum/users/${userId}/posts`);
  }

  addComment(postId: number, comment: { content: string, isAnswer?: boolean }): Observable<any> {
    return this.http.post(`${this.apiUrl}/forum/posts/${postId}/comments`, comment);
  }

  updateComment(commentId: number, content: string): Observable<any> {

    return this.http.put(`${this.apiUrl}/forum/comments/${commentId}`, { content });
  }

  deleteComment(commentId: number): Observable<any> {
  
    return this.http.delete(`${this.apiUrl}/forum/comments/${commentId}`);
  }

  upvotePost(postId: number): Observable<any> {

    return this.http.post(`${this.apiUrl}/forum/posts/${postId}/upvote`, {});
  }

  removeUpvote(postId: number): Observable<any> {
   
    return this.http.delete(`${this.apiUrl}/forum/posts/${postId}/upvote`);
  }

  markPostAsSolved(postId: number): Observable<any> {
   
    return this.http.post(`${this.apiUrl}/forum/posts/${postId}/solve`, {});
  }

  reportPost(postId: number, reason: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forum/posts/${postId}/report`, { reason });
  }

  getCommentsForPost(postId: number): Observable<ForumComment[]> {
    return this.http.get<ForumComment[]>(`${this.apiUrl}/forum/posts/${postId}/comments`);
  }

  getForumReports(status?: string): Observable<ForumReport[]> {
    let url = `${this.apiUrl}/admin/forum/reports`;
    if (status) {
      url += `?status=${encodeURIComponent(status)}`;
    }
    return this.http.get<ForumReport[]>(url);
  }

  getForumReportStats(): Observable<{ total: number, pending: number, resolved: number, ignored: number }> {
    return this.http.get<{ total: number, pending: number, resolved: number, ignored: number }>(
      `${this.apiUrl}/admin/forum/reports/stats`
    );
  }

  getForumReportById(reportId: number): Observable<ForumReport> {
    return this.http.get<ForumReport>(`${this.apiUrl}/admin/forum/reports/${reportId}`);
  }

  pinPost(postId: number): Observable<any> {
    return this.http.post(`${environment.apiUrl}/forum/posts/${postId}/pin`, {});
  }

  unpinPost(postId: number): Observable<any> {
    return this.http.post(`${environment.apiUrl}/forum/posts/${postId}/unpin`, {});
  }

  takeForumReportAction(reportId: number, action: 'delete' | 'ignore', adminNote: string = ''): Observable<void> {
    return this.http.put<void>(
      `${environment.apiUrl}/admin/forum/reports/${reportId}/action`,
      { action, adminNote }
    );
  }
}
