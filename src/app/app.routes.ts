import { Routes } from '@angular/router';
import { AboutComponent } from './features/about/about.component';
import { ContactComponent } from './features/contact/contact.component';
import { HomeComponent } from './home/home.component';

export const routes: Routes = [
   
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
];
