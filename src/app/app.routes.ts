import { Routes } from '@angular/router';
import { AboutComponent } from './features/about/about.component';
import { ContactComponent } from './features/contact/contact.component';
import { HomeComponent } from './home/home.component';
import { EmptyStateComponent } from './shared/components/empty-state/empty-state.component';
import { RatingStarsComponent } from './shared/components/rating-stars/rating-stars.component';
import { ReviewCardComponent } from './shared/components/review-card/review-card.component';
import { ReviewListComponent } from './shared/components/review-list/review-list.component';
import { ReviewSummaryComponent } from './shared/components/review-summary/review-summary.component';
import { WriteReviewFormComponent } from './shared/components/write-review-form/write-review-form.component';
 import { AdminDashboardComponent } from './Components/Admin/admin-dashboard/admin-dashboard.component';
import { AdminSkillsComponent } from './Components/Admin/admin-skills/admin-skills.component';
import { AdminUsersComponent } from './Components/Admin/admin-users/admin-users.component';
import { EditUserComponent } from './Components/Admin/edit-user/edit-user.component';
import { AddUserComponent } from './Components/Admin/add-user/add-user.component';
import { AdminBookingsComponent } from './Components/Admin/admin-bookings/admin-bookings.component';
import { AdminPaymentsComponent } from './Components/Admin/admin-payments/admin-payments.component';
import { ChartsComponent } from './Components/Admin/charts/charts.component';
import { LoginComponent } from './Auth/login/login.component';
import { RegisterComponent } from './Auth/register/register.component';
import { ForgotPasswordComponent } from './Auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './Auth/reset-password/reset-password.component';
import { VerifyEmailComponent } from './Auth/verify-email/verify-email.component';
import { ResendVerificationEmailComponent } from './Auth/resend-verification-email/resend-verification-email.component';
import { AdminReviewsComponent } from './Components/Admin/admin-reviews/admin-reviews.component';
import { DashboardComponent } from './features/mentor/dashboard/dashboard.component';
import { ProfileManagementComponent } from './features/mentor/profile-management/profile-management.component';
import { PaymentComponent } from './payment/payment.component';
import { AvailabilityManagementComponent } from './features/mentor/availability-management/availability-management.component';
import { PaymentConfirmationComponent } from './payment-confirmation/payment-confirmation.component';

export const routes: Routes = [ 
  { path: '', redirectTo: 'home', pathMatch: 'full' },
//Authentication routes
    { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
 { path: 'verify-email/:token', component: VerifyEmailComponent },
  { path: 'resend-verification', component: ResendVerificationEmailComponent },

{ path: 'payment', component: PaymentComponent },
{path : 'payment-complete', component : PaymentConfirmationComponent},
   { path: 'home', component: HomeComponent},
   { path: 'about', component: AboutComponent},
    { path: 'contact', component: ContactComponent},
    {path: 'emptystate' , component: EmptyStateComponent},
    {path :'rating' , component: RatingStarsComponent},
    {path : 'card', component : ReviewCardComponent},
    {path :'list' , component : ReviewListComponent},
    {path : 'summary', component : ReviewSummaryComponent},
    {path : 'form' , component : WriteReviewFormComponent},
  { path: 'admin', component: AdminDashboardComponent  , children: [
 { path: 'mentors', component: AdminPaymentsComponent },
  {path :'skills', component: AdminSkillsComponent}, 
  {path : 'users', component: AdminUsersComponent},
  {path : 'users/edit-user/:id', component: EditUserComponent},
  {path : 'add-user', component: AddUserComponent},
  {path : 'bookings',component: AdminBookingsComponent},
  {path : 'payments',component: AdminPaymentsComponent},
  {path: 'charts', component: ChartsComponent},
{path :'reviews',component: AdminReviewsComponent},
{path:'home',component:HomeComponent}
  ]
},
{ path: 'mentor/dashboard', component: DashboardComponent },
{ path: 'mentor/profile', component: ProfileManagementComponent },
{ path: 'mentor/availability', component: AvailabilityManagementComponent },

];


