import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import Swiper from 'swiper';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule, Router } from '@angular/router'; // Add Router import
import 'swiper/css';
import { TokenResponseDto } from '../Models/Auth/TokenResponseDto';
import { AuthService } from '../Services/auth.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-home',
  imports: [RouterModule, RouterLink, CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements AfterViewInit, OnInit, OnDestroy {

  currentUser: TokenResponseDto | null = null;
  private destroy = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router // Add Router to constructor
  ) {}

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

  ngAfterViewInit(): void {
    new Swiper('.mySwiper', {
      slidesPerView: 'auto',
      spaceBetween: 20,
      loop: false,
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
      },
      breakpoints: {
        1200: {
          slidesPerView: 4,
          spaceBetween: 24
        },
        768: {
          slidesPerView: 3,
          spaceBetween: 20
        },
        576: {
          slidesPerView: 2,
          spaceBetween: 15
        },
        320: {
          slidesPerView: 1.2,
          spaceBetween: 10
        }
      }
    });
  }

  goToDashboard() {
    if (!this.currentUser || !this.currentUser.role) return;
    if (this.currentUser.role === 'Mentee') {
      this.router.navigate(['/mentee/dashboard']);
    } else if (this.currentUser.role === 'Mentor') {
      this.router.navigate(['/mentor/dashboard']);
    }else if (this.currentUser.role === 'Admin') {
      this.router.navigate(['/admin/charts']);
    }
    
    else {
      this.router.navigate(['/home']);
    }
  }

  // Add this new method
  goToChat() {
    if (!this.currentUser || this.currentUser.role === 'Admin') return;
    this.router.navigate(['/chat']);
  }
}
