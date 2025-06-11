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
import { LoginComponent } from './mentee/login.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
export const routes: Routes = [
 
  {
  path: 'mentee/:menteeId/dashboard',
  loadComponent: () => import('./mentee/mentee-dashboard/mentee-dashboard.component').then(m => m.MenteeDashboardComponent)
},
{
  path: 'mentee/:menteeId/search-mentors',
  loadComponent: () => import('./mentee/mentee-search-mentors/mentee-search-mentors.component').then(m => m.MenteeSearchMentorsComponent)
},
{
  path: 'mentee/:menteeId/bookings',
  loadComponent: () => import('./mentee/mentee-bookings/mentee-bookings.component').then(m => m.MenteeBookingsComponent)
},
{
  path: 'mentee/:menteeId/cv-management',
  loadComponent: () => import('./mentee/cv-management/cv-management.component').then(m => m.CvManagementComponent)
},
  { path: 'mentee/mentor/:id', component: MentorProfileViewComponent },
  { path: 'mentee/:menteeId/booking-form', component: BookingFormComponent },
  { path: 'mentee/:menteeId/booking-details/:id', component: BookingDetailsComponent },

   {
        path: 'home', component: HomeComponent
    },
   // { path: '', redirectTo: 'home', pathMatch: 'full' },
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
    {path : 'form' , component : WriteReviewFormComponent},
    { path: '', component: LoginComponent },
    {
      path: 'mentee/dashboard',
      loadComponent: () => import('./mentee/mentee-dashboard/mentee-dashboard.component').then(m => m.MenteeDashboardComponent),
      // Optionally, you can use a guard or resolver to redirect if menteeId is available
    },
    {
      path: 'mentee/bookings',
      loadComponent: () => import('./mentee/mentee-bookings/mentee-bookings.component').then(m => m.MenteeBookingsComponent),
    },
    {
      path: 'mentee/search-mentors',
      loadComponent: () => import('./mentee/mentee-search-mentors/mentee-search-mentors.component').then(m => m.MenteeSearchMentorsComponent),
    },
    {
      path: 'mentee/cv-management',
      loadComponent: () => import('./mentee/cv-management/cv-management.component').then(m => m.CvManagementComponent),
    },
    {
      path: 'find-mentors',
      loadComponent: () => import('./mentee/mentee-search-mentors/mentee-search-mentors.component').then(m => m.MenteeSearchMentorsComponent)
    },
    {
      path: 'mentee/bookings',
      redirectTo: '',
      pathMatch: 'full',
      // This will be handled in a guard or in the component to extract menteeId from token and redirect
    },
    {
      path: 'mentee/dashboard',
      redirectTo: '',
      pathMatch: 'full',
    },
    {
      path: 'mentee/cv-management',
      redirectTo: '',
      pathMatch: 'full',
    },
    {
      path: 'mentee/search-mentors',
      redirectTo: '',
      pathMatch: 'full',
    },
    {
      path: 'mentee/:menteeId',
      redirectTo: 'mentee/:menteeId/dashboard',
      pathMatch: 'full',
    },
  ];
