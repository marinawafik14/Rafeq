import { AfterViewInit, Component } from '@angular/core';
import Swiper from 'swiper/bundle';
import 'swiper/css/bundle';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements AfterViewInit {
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
}
