import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { ReviewCardComponent } from '../review-card/review-card.component';
import { Reviews } from '../../../Models/Reviews';

@Component({
  selector: 'app-review-list',
  imports: [EmptyStateComponent, ReviewCardComponent, CommonModule],
  templateUrl: './review-list.component.html',
  styleUrl: './review-list.component.css'
})
export class ReviewListComponent {
  reviews: Reviews[] = [ ];
  loading: boolean = true;

}
