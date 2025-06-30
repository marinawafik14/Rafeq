import { AdminContactComponent } from './Components/Admin/admin-contact/admin-contact.component';
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
import { BookingsComponent } from './features/mentor/bookings/bookings.component';
import { CVReviewComponent } from './features/mentor/cv-review/cv-review.component';
import { ChatComponent } from './features/chat/chat.component';
import { MenteeDashboardComponent } from './mentee/mentee-dashboard/mentee-dashboard.component';
import { MenteeSearchMentorsComponent } from './mentee/mentee-search-mentors/mentee-search-mentors.component';
import { MenteeBookingsComponent } from './mentee/mentee-bookings/mentee-bookings.component';
import { CvManagementComponent } from './mentee/cv-management/cv-management.component';
import { BookingDetailsComponent } from './mentee/booking-details/booking-details.component';
import { BookingFormComponent } from './mentee/booking-form/booking-form.component';
import { MentorProfileViewComponent } from './mentee/mentor-profile-view/mentor-profile-view.component';
import { ArticleDetailComponent } from './Auth/article-detail/article-detail.component';
import { FaqComponent } from './Auth/faq/faq.component';
import { ProfileRedirectComponent } from './Auth/Userprofile/profile-redirect/profile-redirect.component';
import { MentorProfileComponent } from './Auth/Userprofile/mentor-profile/mentor-profile.component';
import { MenteeProfileComponent } from './Auth/Userprofile/mentee-profile/mentee-profile.component';
import { ArticlesListComponent } from './Auth/articles-list/articles-list.component';
import { MenteeContactChatComponent } from './Components/mentee-contact-chat/mentee-contact-chat.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  // Authentication routes
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'verify-email/:token', component: VerifyEmailComponent },
  { path: 'resend-verification', component: ResendVerificationEmailComponent },

  // Payment routes
  { path: 'payment', component: PaymentComponent },
  { path: 'payment-complete', component: PaymentConfirmationComponent },

  // General routes
  { path: 'home', component: HomeComponent },
  { path: 'about', component: AboutComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'emptystate', component: EmptyStateComponent },
  { path: 'rating', component: RatingStarsComponent },
  { path: 'card', component: ReviewCardComponent },
  { path: 'list', component: ReviewListComponent },
  { path: 'summary', component: ReviewSummaryComponent },
  { path: 'form', component: WriteReviewFormComponent },

  //USerPorfile

  { path: 'user-profile', component: ProfileRedirectComponent },

  { path: 'mentor-profile', component: MentorProfileComponent },
  { path: 'mentee-profile', component: MenteeProfileComponent },

  //article routes

  { path: 'articles', component: ArticlesListComponent },
  { path: 'articles/:id', component: ArticleDetailComponent },
  { path: 'faq', component: FaqComponent },

  // Admin routes
  {
    path: 'admin',
    component: AdminDashboardComponent,
    children: [
      { path: 'mentors', component: AdminPaymentsComponent },
      { path: 'skills', component: AdminSkillsComponent },
      { path: 'users', component: AdminUsersComponent },
      { path: 'users/edit-user/:id', component: EditUserComponent },
      { path: 'add-user', component: AddUserComponent },
      { path: 'bookings', component: AdminBookingsComponent },
      { path: 'payments', component: AdminPaymentsComponent },
      { path: 'charts', component: ChartsComponent },
      { path: 'reviews', component: AdminReviewsComponent },
      { path: 'home', component: HomeComponent },
      {path: 'contact', component :AdminContactComponent}
    ],
  },

  // Mentor routes
  { path: 'mentor/dashboard', component: DashboardComponent },
  { path: 'mentor/profile', component: ProfileManagementComponent },
  { path: 'mentor/availability', component: AvailabilityManagementComponent },
  { path: 'mentor/bookings', component: BookingsComponent },
  { path: 'mentor/cv-review', component: CVReviewComponent },

  // Mentee routes with lazy loading
  {
    path: 'mentee/:menteeId',
    redirectTo: 'mentee/:menteeId/dashboard',
    pathMatch: 'full',
  },
  {
    path: 'mentee/:menteeId/dashboard',
    loadComponent: () =>
      import('./mentee/mentee-dashboard/mentee-dashboard.component').then(
        (m) => m.MenteeDashboardComponent
      ),
  },
  {
    path: 'mentee/:menteeId/search-mentors',
    loadComponent: () =>
      import(
        './mentee/mentee-search-mentors/mentee-search-mentors.component'
      ).then((m) => m.MenteeSearchMentorsComponent),
  },
  {
    path: 'mentee/:menteeId/bookings',
    loadComponent: () =>
      import('./mentee/mentee-bookings/mentee-bookings.component').then(
        (m) => m.MenteeBookingsComponent
      ),
  },
  {
    path: 'mentee/:menteeId/cv-management',
    loadComponent: () =>
      import('./mentee/cv-management/cv-management.component').then(
        (m) => m.CvManagementComponent
      ),
  },
  {
    path: 'mentee/:menteeId/booking-details/:id',
    loadComponent: () =>
      import('./mentee/booking-details/booking-details.component').then(
        (m) => m.BookingDetailsComponent
      ),
  },
  {
    path: 'mentee/:menteeId/booking-form',
    loadComponent: () =>
      import('./mentee/booking-form/booking-form.component').then(
        (m) => m.BookingFormComponent
      ),
  },
  {
    path: 'mentee/:menteeId/mentor/:id',
    loadComponent: () =>
      import('./mentee/mentor-profile-view/mentor-profile-view.component').then(
        (m) => m.MentorProfileViewComponent
      ),
  },
  {
    path: 'mentee/:menteeId/payment',
    loadComponent: () =>
      import('./payment/payment.component').then((m) => m.PaymentComponent),
  },
  {
    path: 'mentee/:menteeId/payment-complete',
    loadComponent: () =>
      import('./payment-confirmation/payment-confirmation.component').then(
        (m) => m.PaymentConfirmationComponent
      ),
  },

  // Chat routes
  { path: 'chat', component: ChatComponent },
  { path: 'chat/:bookingId', component: ChatComponent },
  {path: 'messages', component : MenteeContactChatComponent}
];
