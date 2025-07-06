import { AdminContactComponent } from './Components/Admin/admin-contact/admin-contact.component';
import { Routes } from '@angular/router';
import { AboutComponent } from './features/about/about.component';
import { ContactComponent } from './features/contact/contact.component';
import { HomeComponent } from './home/home.component';
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

import { AvailabilityManagementComponent } from './features/mentor/availability-management/availability-management.component';
import { BookingsComponent } from './features/mentor/bookings/bookings.component';
import { CVReviewComponent } from './features/mentor/cv-review/cv-review.component';
import { ChatComponent } from './features/chat/chat.component';
import { FaqComponent } from './Auth/faq/faq.component';
import { ProfileRedirectComponent } from './Auth/Userprofile/profile-redirect/profile-redirect.component';
import { MentorProfileComponent } from './Auth/Userprofile/mentor-profile/mentor-profile.component';
import { MenteeProfileComponent } from './Auth/Userprofile/mentee-profile/mentee-profile.component';
import { ArticlesListComponent } from './Auth/articles-list/articles-list.component';
import { NotFoundComponent } from './Auth/not-found/not-found.component';
import { MenteeContactChatComponent } from './mentee/mentee-contact-chat/mentee-contact-chat.component';
import { MenteeLayoutComponent } from './mentee/mentee-layout.component';
import { ArticleDetailComponent } from './Auth/article-detail/article-detail.component';
import { authGuardGuard } from './guards/auth-guard.guard';
import { AdminDashboardComponent } from './Components/Admin/admin-dashboard/admin-dashboard.component';



export const routes: Routes = [

  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'about', component: AboutComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'verify-email/:token', component: VerifyEmailComponent },
  { path: 'resend-verification', component: ResendVerificationEmailComponent },
  { path: 'articles', component: ArticlesListComponent },
  { path: 'articles/:id', component: ArticleDetailComponent },
  { path: 'faq', component: FaqComponent },
  { path: 'chat', component: ChatComponent },
  { path: 'chat/:bookingId', component: ChatComponent },
  // general guard depends on user role
  {
    path: '',
    canActivateChild: [authGuardGuard],
    children: [
      // Admin
      {
        path: 'admin',
        component: AdminDashboardComponent,
        data: { roles: ['Admin'] },
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
          { path: 'contact', component: AdminContactComponent },

        ],
      },

      // Mentor
      {
        path: 'mentor',
        canActivateChild: [authGuardGuard],
        data: { roles: ['Mentor'] },
        children: [
          { path: 'dashboard', component: DashboardComponent },
          { path: 'availability', component: AvailabilityManagementComponent },
          { path: 'bookings', component: BookingsComponent },
          { path: 'cv-review', component: CVReviewComponent },

        ],
      },

      // Mentee
      {
        path: 'mentee',
        canActivateChild: [authGuardGuard],
        data: { roles: ['Mentee'] },
        component: MenteeLayoutComponent, 
        children: [
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          {
            path: 'dashboard',
            loadComponent: () =>
              import('./mentee/mentee-dashboard/mentee-dashboard.component').then(
                (m) => m.MenteeDashboardComponent
              ),
          },
          {
            path: 'bookings',
            loadComponent: () =>
              import('./mentee/mentee-bookings/mentee-bookings.component').then(
                (m) => m.MenteeBookingsComponent
              ),
          },
          {
            path: 'search-mentors',
            loadComponent: () =>
              import('./mentee/mentee-search-mentors/mentee-search-mentors.component').then(
                (m) => m.MenteeSearchMentorsComponent
              ),
          },
          {
            path: 'cv-management',
            loadComponent: () =>
              import('./mentee/cv-management/cv-management.component').then(
                (m) => m.CvManagementComponent
              ),
          },
          {
            path: 'booking-details/:id',
            loadComponent: () =>
              import('./mentee/booking-details/booking-details.component').then(
                (m) => m.BookingDetailsComponent
              ),
          },
          {
            path: 'booking-form',
            loadComponent: () =>
              import('./mentee/booking-form/booking-form.component').then(
                (m) => m.BookingFormComponent
              ),
          },
          {
            path: 'mentor/:id',
            loadComponent: () =>
              import('./mentee/mentor-profile-view/mentor-profile-view.component').then(
                (m) => m.MentorProfileViewComponent
              ),
          },
          {
            path: 'payment',
            loadComponent: () =>
              import('./payment/payment.component').then((m) => m.PaymentComponent),
          },
          {
            path: 'payment-complete',
            loadComponent: () =>
              import('./payment-confirmation/payment-confirmation.component').then(
                (m) => m.PaymentConfirmationComponent
              ),
          },
          {
            path: 'messages',
            loadComponent: () =>
              import('./mentee/mentee-contact-chat/mentee-contact-chat.component').then(
                (m) => m.MenteeContactChatComponent
              ),
          },
          {
            path: 'profile',
            loadComponent: () =>
              import('./Auth/Userprofile/mentee-profile/mentee-profile.component').then(
                (m) => m.MenteeProfileComponent
              ),
          },
          {
            path: 'ai-chatbot',
            loadComponent: () =>
              import('./features/ai-chatbot/ai-chatbot.component').then(
                (m) => m.AiChatbotComponent
              ),
          },
          {
            path: 'notifications',
            loadComponent: () =>
              import('./features/notifications/notifications.component').then(
                (m) => m.NotificationsComponent
              ),
          },
        ],
      },
{
        path: 'ai-chatbot',
        loadComponent: () =>
          import('./features/ai-chatbot/ai-chatbot.component').then(
            (m) => m.AiChatbotComponent
          ),
        data: { roles: ['Mentor'] },
      },
      // User Profiles
      { path: 'user-profile', component: ProfileRedirectComponent },
      { path: 'mentor-profile', component: MentorProfileComponent },
      { path: 'mentee-profile', component: MenteeProfileComponent },

    ],
  },

  // Not found
  { path: '**', component: NotFoundComponent }
];