import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../Services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile-redirect',
  imports: [],
  templateUrl: './profile-redirect.component.html',
  styleUrl: './profile-redirect.component.css'
})
export class ProfileRedirectComponent implements OnInit {

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      if (user) {
        if (user.role === 'Mentor') {
          this.router.navigate(['/mentor-profile']);
        } else if (user.role === 'Mentee') {
          this.router.navigate(['/mentee-profile']);
        } else {
          this.router.navigate(['/home']); // Default redirect
        }
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

}
