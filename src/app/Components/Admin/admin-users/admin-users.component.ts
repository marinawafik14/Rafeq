import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Users } from '../../../Models/Users';
import { UserService } from '../../../Services/user.service';
import { CommonModule, DatePipe } from '@angular/common';
import { AddUserComponent } from "../add-user/add-user.component";
import { Observable } from 'rxjs';

@Component({
  selector: 'app-admin-users',
  imports: [FormsModule, CommonModule, DatePipe, AddUserComponent,RouterLink],
  standalone: true,
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css'
})
export class AdminUsersComponent implements OnInit {
   users :Users[] = [];
   showAddUserForm = false;
 searchQuery: string = '';
roleFilter: string = '';
statusFilter: boolean = false; // true for active, false for inactive
dateSort: string = 'newest';
currentPage : number = 1;
  itemsPerPage: number = 10;
   constructor( private _userService : UserService){}

 ngOnInit(): void {
this.loadUsers();

 
 }  
// Load all users from the service
 loadUsers(): void {
    this._userService.getAllUsers().subscribe({
      next: data => this.users = data,
      complete: () => console.log('Users loaded successfully', this.users),
      error: err => console.error('Failed to load users:', err)
    });
  }

// update user status
updateUserStatus(userId: number, isActive: boolean): void {
    this._userService.updateStatus(userId, isActive).subscribe({
      next: (updatedUser) => {
        const index = this.users.findIndex(user => user.id === userId);
        if (index !== -1) {
          this.users[index] = updatedUser;
        }
      },
      error: (err) => console.error('Failed to update user status:', err)
    });
  }

// delete a user
deleteUser(userId: number): void {
    this._userService.deleteUser(userId).subscribe({
      next: () => {
        this.users = this.users.filter(user => user.id !== userId);
      },
      error: (err) => console.error('Failed to delete user:', err)
    });
  }

// edit user
editUser(user: Users): void {
    this._userService.updateUser(user.id, user).subscribe({
      next: (updatedUser) => {
        const index = this.users.findIndex(u => u.id === user.id);
        if (index !== -1) {
          this.users[index] = updatedUser;
        }
      },
      error: (err) => console.error('Failed to update user:', err)
    });
  } 



  // Add a new user

saveNewUser(user: Users): void 
{
this._userService.createUser(user).subscribe({
next : (addedUser) => {
  this.users.push(addedUser);
  this.showAddUserForm = false; // Hide the form after saving
},
error: (err) => console.error('Failed to add user:', err)
});
}



// Search, filter, and sort functionality
 
  get filteredUsers(): Users[] {
    return this.users
    .filter(user => {
  const name = user.fullName?.toLowerCase() || '';
  const email = user.email?.toLowerCase() || '';
  const query = this.searchQuery.toLowerCase();

  return (name.includes(query) || email.includes(query)) &&
         (this.roleFilter ? user.role === this.roleFilter : true) &&
         (this.statusFilter ? user.isActive === true : true);
})

      .sort((a, b) => {
        if (this.dateSort === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } else {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
      });

     
  }

  //pagination 
   get getpaginatedUsers(): Users[] {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage; 
        const endIndex = startIndex + this.itemsPerPage;     
        return this.filteredUsers.slice(startIndex, endIndex);
        
      }

get totalPages(): number {
    return Math.ceil(this.filteredUsers.length / this.itemsPerPage);
  }
  changePage(page: number): void {
    if (page > 0 && page <= this.totalPages) {
      this.currentPage = page;
    }
  } 

}







