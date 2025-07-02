import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TokenResponseDto } from '../../Models/Auth/TokenResponseDto';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../Services/auth.service';

@Component({
  selector: 'app-about',
  imports: [CommonModule, RouterModule],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css'
})
export class AboutComponent implements OnInit,OnDestroy {
 currentUser: TokenResponseDto | null = null;
    private destroy = new Subject<void>();

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser
      .pipe(takeUntil(this.destroy))
      .subscribe(user => {
        this.currentUser = user;
      });
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }
}
