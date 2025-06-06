import { Routes } from '@angular/router';
import { MenteeDashboardComponent } from './mentee/mentee-dashboard/mentee-dashboard.component';
import { MenteeSearchMentorsComponent } from './mentee/mentee-search-mentors/mentee-search-mentors.component';
import { MentorProfileViewComponent } from './mentee/mentor-profile-view/mentor-profile-view.component';
import { BookingFormComponent } from './mentee/booking-form/booking-form.component';
import { MenteeBookingsComponent } from './mentee/mentee-bookings/mentee-bookings.component';
import { CvManagementComponent } from './mentee/cv-management/cv-management.component';
import { BookingDetailsComponent } from './mentee/booking-details/booking-details.component';

export const routes: Routes = [
  { path: '', redirectTo: 'mentee/3/dashboard', pathMatch: 'full' },
  { path: 'mentee/:menteeId/dashboard', component: MenteeDashboardComponent },
  { path: 'mentee/search-mentors', component: MenteeSearchMentorsComponent },
  { path: 'mentee/mentor/:id', component: MentorProfileViewComponent },
  { path: 'mentee/booking-form', component: BookingFormComponent },
  { path: 'mentee/bookings', component: MenteeBookingsComponent },
  { path: 'mentee/cv-management', component: CvManagementComponent },
  { path: 'mentee/booking-details/:id', component: BookingDetailsComponent },
];
