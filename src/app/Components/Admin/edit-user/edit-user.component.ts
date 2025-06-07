import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../Services/user.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Users } from '../../../Models/Users';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-edit-user',
  imports: [CommonModule , FormsModule, RouterLink],
  templateUrl: './edit-user.component.html',
  styleUrl: './edit-user.component.css'
})
export class EditUserComponent implements OnInit {
user : Users | null = null;
  constructor(private route: ActivatedRoute , private userService : UserService , private router : Router ) { }

  ngOnInit(): void {
const userId = Number(this.route.snapshot.paramMap.get('id'));
this.userService.getUserById(userId).subscribe({
 next: (user) => (this.user = user),
      error: (err) => console.error('Failed to load user:', err)
    });
}

// save user
saveUser(){
  if (this.user) {
    this.userService.updateUser(this.user.id , this.user).subscribe({
      next: () => {
        console.log('User updated successfully');
        this.router.navigate(['/admin/users']);
      },
      error: (err) => console.error('Failed to update user:', err)
    });
  } else {
    console.error('No user data available to save');
  }
}
}
