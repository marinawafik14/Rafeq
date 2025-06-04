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
    {path: 'emptystate' , component: EmptyStateComponent},
    {path :'rating' , component: RatingStarsComponent},
    {path : 'card', component : ReviewCardComponent},
    {path :'list' , component : ReviewListComponent},
    {path : 'summary', component : ReviewSummaryComponent},
    {path : 'form' , component : WriteReviewFormComponent}
];
