 import { Routes } from '@angular/router';
import { AdminMentorsComponent } from './Components/Admin/admin-mentors/admin-mentors.component';
 import { AdminDashboardComponent } from './Components/Admin/admin-dashboard/admin-dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: 'admin', pathMatch: 'full' },
  { path: 'admin', component: AdminDashboardComponent },
  { path: 'admin/mentors', component: AdminMentorsComponent },
];


