import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-floating-dashboard-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './floating-dashboard-button.component.html',
  styleUrls: ['./floating-dashboard-button.component.css']
})
export class FloatingDashboardButtonComponent {
  @Input() show: boolean = true;

  constructor(private router: Router) {}

  goToDashboard(): void {
    this.router.navigate(['/mentor/dashboard']);
  }
}
