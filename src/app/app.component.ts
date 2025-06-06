import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenteeSearchMentorsComponent } from './mentee/mentee-search-mentors/mentee-search-mentors.component';
import { MenteeDashboardComponent } from './mentee/mentee-dashboard/mentee-dashboard.component';
import { MentorProfileViewComponent } from './mentee/mentor-profile-view/mentor-profile-view.component';
import { BookingFormComponent } from './mentee/booking-form/booking-form.component';
import { MenteeBookingsComponent } from './mentee/mentee-bookings/mentee-bookings.component';
import {CvManagementComponent} from './mentee/cv-management/cv-management.component'
import{BookingDetailsComponent}from './mentee/booking-details/booking-details.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,
    MenteeSearchMentorsComponent,
    MenteeDashboardComponent,
    MentorProfileViewComponent, 
    BookingFormComponent, 
    MenteeBookingsComponent ,
    CvManagementComponent,
    BookingDetailsComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'rafeq-app';
}
