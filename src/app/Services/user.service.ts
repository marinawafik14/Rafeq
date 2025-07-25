import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EditUser, Users } from '../Models/Users';
import { environment } from '../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class UserService {
private usersUrl = `${environment.apiUrl}/admin/users`; 
private userIdUrl = `${environment.apiUrl}/admin`;
  constructor(private http : HttpClient) { }
  getAllUsers():Observable<Users[]> {
    return this.http.get<Users[]>(this.usersUrl);
   
  }

  getUserById(userId: number) : Observable<Users> {
    return this.http.get<Users>(`${this.userIdUrl}/${userId}`);
  }

  updateUser(userId: number, userData: EditUser) :Observable<EditUser> {
    return this.http.put<EditUser>(`${this.usersUrl}/${userId}`, userData);
  }
  deleteUser(userId: number) :Observable<void> {
     return this.http.delete<void>(`${this.usersUrl}/${userId}`);
  }
  createUser(userData: Users): Observable<Users> {

     return this.http.post<Users>(`${this.usersUrl}`, userData);
  }

  updateStatus(Id: number, status: boolean): Observable<Users> {
    console.log('Sending request for userId:', Id, 'Status:', status);
     return this.http.put<Users>(`${this.usersUrl}/${Id}/status?isActive=${status}`, null)
   


  }


}
