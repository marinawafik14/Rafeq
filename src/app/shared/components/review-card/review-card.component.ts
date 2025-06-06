import { Component,Input } from '@angular/core';
import { RatingStarsComponent } from '../rating-stars/rating-stars.component';
import { DatePipe } from '@angular/common';
import { Reviews } from '../../../Models/Reviews';

@Component({
  selector: 'app-review-card',
  imports: [RatingStarsComponent, DatePipe],
  templateUrl: './review-card.component.html',
  styleUrl: './review-card.component.css'
})
export class ReviewCardComponent {
@Input() review!: Reviews;
}
