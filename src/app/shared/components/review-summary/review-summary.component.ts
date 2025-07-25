import { Component,Input } from '@angular/core';
import { Reviews } from '../../../Models/Reviews';

@Component({
  selector: 'app-review-summary',
  imports: [],
  templateUrl: './review-summary.component.html',
  styleUrl: './review-summary.component.css'
})
export class ReviewSummaryComponent {
  @Input() reviews: Reviews[] = [];

  averageRating: number = 0;
  fiveStarPercent: number = 0;

  ngOnChanges(): void {
    if (this.reviews && this.reviews.length > 0) {
      this.calculateStats();
    }
  }

  private calculateStats(): void {
    const total = this.reviews.length;
    const sum = this.reviews.reduce((acc, review) => acc + (review.rating || 0), 0);
    
    this.averageRating = Number((sum / total).toFixed(1));

    const fiveStarCount = this.reviews.filter(r => r.rating === 5).length;
    this.fiveStarPercent = Math.round((fiveStarCount / total) * 100);
}
}