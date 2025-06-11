import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { HeaderComponent } from "./header/header.component";
import { FooterComponent } from './footer/footer.component';

import { filter } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent,CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent  {
 title = 'rafeq-app';
  showLayout = true;

   constructor(private router: Router) {
   
    const currentUrl = this.router.url.toLowerCase();
    this.showLayout = !currentUrl.includes('/admin');

   
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const url = event.urlAfterRedirects.toLowerCase();
        this.showLayout = !url.includes('/admin');
      });
  
  }
  }
 
  
 
 
 
  

