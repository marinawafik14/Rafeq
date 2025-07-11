import { EditUser } from './../../../Models/Users';
import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../Services/user.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Users } from '../../../Models/Users';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-edit-user',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './edit-user.component.html',
  styleUrl: './edit-user.component.css'
})
export class EditUserComponent implements OnInit {


  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private router: Router
  ) {}
 user: EditUser = {
  fullName: '',
  email: '',
  profilePicture: '',
  bio: '',
  role: '',
  isMentor: false,
  isInterviewer: false,
  hourlyRate: 0
};
  ngOnInit(): void {
   const userId = Number(this.route.snapshot.paramMap.get('id'));
  this.userService.getUserById(userId).subscribe({
    next: (userData: Users) => {
      this.user = {
        fullName: userData.fullName,
        email: userData.email,
        profilePicture: userData.profilePicture,
        bio: userData.bio,
        role: userData.role,
        isMentor: userData.isMentor,
        isInterviewer: userData.isInterviewer,
        hourlyRate: userData.hourlyRate
      };
      console.log('User loaded successfully:', this.user);
    },
    error: (err) => console.error('Failed to load user:', err)
  });
  }

  saveUser(): void {
  const userId = Number(this.route.snapshot.paramMap.get('id'));
  this.userService.updateUser(userId, this.user).subscribe({
    next: () => this.router.navigate(['/admin/users']),
    error: (err) => console.error('Failed to update user:', err)
  });
}
   

  
}