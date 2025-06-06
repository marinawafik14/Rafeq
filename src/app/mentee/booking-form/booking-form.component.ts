import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenteeLayoutComponent } from '../mentee-layout.component';

@Component({
  selector: 'app-booking-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MenteeLayoutComponent],
  templateUrl: './booking-form.component.html',
  styleUrls: ['./booking-form.component.css']
})
export class BookingFormComponent {
  step = 1;
  sessionType: 'mentorship' | 'interview' | null = null;
  selectedDate: string | null = null;
  availableDates: string[] = ['2025-06-05', '2025-06-06', '2025-06-07']; // Example, replace with API
  availableSlots: string[] = [];
  selectedSlot: string | null = null;
  price = 0;
  termsAccepted = false;
  paymentComplete = false;

  // Example pricing logic
  get calculatedPrice() {
    return this.sessionType === 'interview' ? 100 : 60;
  }

  nextStep() {
    if (this.step < 4) this.step++;
  }
  prevStep() {
    if (this.step > 1) this.step--;
  }

  selectSessionType(type: 'mentorship' | 'interview') {
    this.sessionType = type;
    this.nextStep();
  }

  selectDate(date: string) {
    this.selectedDate = date;
    // Example: fetch available slots for the date
    this.availableSlots = date === '2025-06-05' ? ['10:00', '14:00'] : ['09:00', '13:00', '16:00'];
    this.selectedSlot = null;
    this.nextStep();
  }

  selectSlot(slot: string) {
    this.selectedSlot = slot;
    this.nextStep();
  }

  completePayment() {
    this.paymentComplete = true;
    this.nextStep();
  }
}
