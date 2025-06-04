import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-write-review-form',
  imports: [CommonModule],
  templateUrl: './write-review-form.component.html',
  styleUrl: './write-review-form.component.css'
})
export class WriteReviewFormComponent {
selectedRating: number = 0;
}
