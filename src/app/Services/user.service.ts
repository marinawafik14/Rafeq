import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Users } from '../Models/Users';

@Injectable({
  providedIn: 'root'
})
export class UserService {
private usersUrl = "https://localhost:7001/api/admin/users"; 
private userIdUrl = "https://localhost:7001/api/users";
  constructor(private http : HttpClient) { }
  // get all users
  getAllUsers():Observable<Users[]> {
    return this.http.get<Users[]>(this.usersUrl);
   
  }

  // get user by id
  getUserById(userId: number) : Observable<Users> {
    return this.http.get<Users>(`${this.userIdUrl}/${userId}`);
  }

// update user
  updateUser(userId: number, userData: Users) :Observable<Users> {
    return this.http.put<Users>(`${this.usersUrl}/${userId}`, userData);
  }
  // delete user
  deleteUser(userId: number) :Observable<void> {
     return this.http.delete<void>(`${this.usersUrl}/${userId}`);
  }
  // create user
  createUser(userData: Users): Observable<Users> {

     return this.http.post<Users>(`${this.usersUrl}`, userData);
  }

// update user status
  updateStatus(Id: number, status: boolean): Observable<Users> {
    console.log('Sending request for userId:', Id, 'Status:', status);
     return this.http.put<Users>(`${this.usersUrl}/${Id}/status?isActive=${status}`, null)
   


  }


}
