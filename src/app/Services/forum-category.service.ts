import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ForumCategory } from '../Models/Forum/forum-category.model';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ForumCategoryService {
  private apiUrl = environment.apiUrl + '/forum/categories';

  constructor(private http: HttpClient) { }

  getAllCategories(): Observable<ForumCategory[]> {
    return this.http.get<ForumCategory[]>(this.apiUrl);
  }

  createCategory(category: { name: string; description?: string }): Observable<ForumCategory> {
    return this.http.post<ForumCategory>(this.apiUrl, category);
  }

  updateCategory(id: number, data: { name: string; description?: string }): Observable<ForumCategory> {
    return this.http.put<ForumCategory>(`${this.apiUrl}/${id}`, data);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
