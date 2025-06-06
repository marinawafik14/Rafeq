import { Routes } from '@angular/router';
import { MenteeDashboardComponent } from './mentee/mentee-dashboard/mentee-dashboard.component';
import { MenteeSearchMentorsComponent } from './mentee/mentee-search-mentors/mentee-search-mentors.component';
import { MentorProfileViewComponent } from './mentee/mentor-profile-view/mentor-profile-view.component';
import { BookingFormComponent } from './mentee/booking-form/booking-form.component';
import { MenteeBookingsComponent } from './mentee/mentee-bookings/mentee-bookings.component';
import { CvManagementComponent } from './mentee/cv-management/cv-management.component';
import { BookingDetailsComponent } from './mentee/booking-details/booking-details.component';
import { AboutComponent } from './features/about/about.component';
import { ContactComponent } from './features/contact/contact.component';
import { HomeComponent } from './home/home.component';
import { EmptyStateComponent } from './shared/components/empty-state/empty-state.component';
import { RatingStarsComponent } from './shared/components/rating-stars/rating-stars.component';
import { ReviewCardComponent } from './shared/components/review-card/review-card.component';
import { ReviewListComponent } from './shared/components/review-list/review-list.component';
import { ReviewSummaryComponent } from './shared/components/review-summary/review-summary.component';
import { WriteReviewFormComponent } from './shared/components/write-review-form/write-review-form.component';
export const routes: Routes = [
  { path: '', redirectTo: 'mentee/3/dashboard', pathMatch: 'full' },
  { path: 'mentee/:menteeId/dashboard', component: MenteeDashboardComponent },
  { path: 'mentee/search-mentors', component: MenteeSearchMentorsComponent },
  { path: 'mentee/mentor/:id', component: MentorProfileViewComponent },
  { path: 'mentee/booking-form', component: BookingFormComponent },
  { path: 'mentee/bookings', component: MenteeBookingsComponent },
  { path: 'mentee/cv-management', component: CvManagementComponent },
  { path: 'mentee/booking-details/:id', component: BookingDetailsComponent },

   {
        path: 'home', component: HomeComponent
    },
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    {
    
        path: 'about', component: AboutComponent
    },
    {
        path: 'contact', component: ContactComponent
    },
    {path: 'emptystate' , component: EmptyStateComponent},
    {path :'rating' , component: RatingStarsComponent},
    {path : 'card', component : ReviewCardComponent},
    {path :'list' , component : ReviewListComponent},
    {path : 'summary', component : ReviewSummaryComponent},
    {path : 'form' , component : WriteReviewFormComponent}
];
