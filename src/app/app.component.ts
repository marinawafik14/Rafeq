import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenteeSearchMentorsComponent } from './mentee/mentee-search-mentors/mentee-search-mentors.component';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';

import { ErrorHandler, Injectable } from '@angular/core';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MenteeSearchMentorsComponent, HeaderComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'rafeq-app';
}

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    // Log the error or send to a server
    console.error('Global error:', error);
    // Optionally, show a user-friendly message
    // alert('An unexpected error occurred. Please try again.');
  }
}
