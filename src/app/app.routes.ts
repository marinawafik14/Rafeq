 import { Routes } from '@angular/router';
import { AdminMentorsComponent } from './Components/Admin/admin-mentors/admin-mentors.component';
 import { AdminDashboardComponent } from './Components/Admin/admin-dashboard/admin-dashboard.component';
import { AdminSkillsComponent } from './Components/Admin/admin-skills/admin-skills.component';
import { AdminUsersComponent } from './Components/Admin/admin-users/admin-users.component';
import { EditUserComponent } from './Components/Admin/edit-user/edit-user.component';
import { AddUserComponent } from './Components/Admin/add-user/add-user.component';
import { AdminBookingsComponent } from './Components/Admin/admin-bookings/admin-bookings.component';
import { AdminPaymentsComponent } from './Components/Admin/admin-payments/admin-payments.component';
import { ChartsComponent } from './Components/Admin/charts/charts.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'admin', component: AdminDashboardComponent  , children: [
 { path: 'mentors', component: AdminMentorsComponent },
  {path :'skills', component: AdminSkillsComponent}, 
  {path : 'users', component: AdminUsersComponent},
  {path : 'users/edit-user/:id', component: EditUserComponent},
  {path : 'add-user', component: AddUserComponent},
  {path : 'bookings',component: AdminBookingsComponent},
  {path : 'payments',component: AdminPaymentsComponent},
  {path: 'charts', component: ChartsComponent}

  ]
},
 
];


