import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { AvailabilityService } from '../../../Services/availability.service';
import { AuthService } from '../../../Services/auth.service';
import { AvailabilitySlot } from '../../../Models/Availability/availability-slot';
import { CreateAvailabilityRequest } from '../../../Models/Availability/create-availability-request';
import { UpdateAvailabilityRequest } from '../../../Models/Availability/update-availability-request';
import { WeeklySchedule } from '../../../Models/Availability/weekly-schedule';
import { CalendarDay } from '../../../Models/Calendar/calendar-day';
//import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-availability-management',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './availability-management.component.html',
  styleUrls: ['./availability-management.component.css']
})
export class AvailabilityManagementComponent implements OnInit {
  currentUserId: number = 0;
  availabilitySlots: AvailabilitySlot[] = [];
  weeklySchedule: WeeklySchedule = {};
  calendarDays: CalendarDay[] = [];
  
  addSlotForm: FormGroup;
  editSlotForm: FormGroup;
  isLoading: boolean = true;
  isAddingSlot: boolean = false;
  isEditingSlot: boolean = false;
  showAddForm: boolean = false;
  showEditModal: boolean = false;
  selectedSlotForEdit: AvailabilitySlot | null = null;
  error: string | null = null;

 
  dayNames: string[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  timeSlots: string[] = [];
  selectedDay: number = -1;
  bulkAddMode: boolean = false;
  selectedDaysForBulk: boolean[] = [false, false, false, false, false, false, false];

  constructor(
    private fb: FormBuilder,
    public availabilityService: AvailabilityService, 
    private authService: AuthService,
   // private toastr: ToastrService
  ) {
    this.addSlotForm = this.fb.group({
      dayOfWeek: [0, [Validators.required, Validators.min(0), Validators.max(6)]],
      startTime: ['09:00', [Validators.required]],
      endTime: ['17:00', [Validators.required]],
      recurring: [false]
    });

    this.editSlotForm = this.fb.group({
      dayOfWeek: [0, [Validators.required, Validators.min(0), Validators.max(6)]],
      startTime: ['09:00', [Validators.required]],
      endTime: ['17:00', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.currentUserId = this.authService.currentUserValue?.userId || 0;
    this.timeSlots = this.availabilityService.generateTimeSlots(0, 24, 30);
    this.initializeCalendarDays();
    this.loadAvailability();
  }

  initializeCalendarDays(): void {
    this.calendarDays = this.dayNames.map((dayName, index) => ({
      dayOfWeek: index,
      dayName: dayName,
      date: new Date(), 
      slots: [],
      isToday: new Date().getDay() === index
    }));
  }

  loadAvailability(): void {
    this.isLoading = true;
    this.availabilityService.getUserAvailability(this.currentUserId).subscribe({
      next: (slots) => {
        this.availabilitySlots = slots;
        this.weeklySchedule = this.availabilityService.organizeByWeek(slots);
        this.updateCalendarDays();
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Failed to load availability data';
        this.isLoading = false;
        console.error('Error loading availability:', error);
      }
    });
  }

  updateCalendarDays(): void {
    this.calendarDays.forEach(day => {
      day.slots = this.weeklySchedule[day.dayOfWeek] || [];
    });
  }

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (this.showAddForm) {
      this.addSlotForm.reset({
        dayOfWeek: 0,
        startTime: '09:00',
        endTime: '17:00',
        recurring: false
      });
    }
  }

  onAddSlot(): void {
    if (this.addSlotForm.valid) {
      this.isAddingSlot = true;
      const formData = this.addSlotForm.value;
      
      const request: CreateAvailabilityRequest = {
        userId: this.currentUserId,
        dayOfWeek: formData.dayOfWeek,
        startTime: `${formData.startTime}:00`,
        endTime: `${formData.endTime}:00`
      };

     
      const validation = this.availabilityService.validateTimeSlot(
        request.startTime,
        request.endTime,
        this.availabilitySlots,
        request.dayOfWeek
      );

      if (validation.hasConflict) {
        this.isAddingSlot = false;
        
        Swal.fire({
          icon: 'warning',
          title: 'Time Conflict',
          text: validation.message,
          confirmButtonColor: '#0a2e65'
        });
        return;
      }

      if (formData.recurring) {
        this.addRecurringSlots(request);
      } else {
        this.addSingleSlot(request);
      }
    } else {
      this.markFormGroupTouched(this.addSlotForm);
    }
  }

  addSingleSlot(request: CreateAvailabilityRequest): void {
    this.availabilityService.addAvailabilitySlot(request).subscribe({
      next: (newSlot) => {
        this.availabilitySlots.push(newSlot);
        this.weeklySchedule = this.availabilityService.organizeByWeek(this.availabilitySlots);
        this.updateCalendarDays();
        this.isAddingSlot = false;
        this.showAddForm = false;
        
     
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Availability slot added successfully!',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      },
      error: (error) => {
        this.isAddingSlot = false;
        console.error('Error adding slot:', error);
        
   
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'Failed to add availability slot. Please try again.',
          confirmButtonColor: '#0a2e65'
        });
      }
    });
  }

  addRecurringSlots(baseRequest: CreateAvailabilityRequest): void {
    const requests: CreateAvailabilityRequest[] = [];
    
    for (let day = 0; day < 7; day++) {
      const validation = this.availabilityService.validateTimeSlot(
        baseRequest.startTime,
        baseRequest.endTime,
        this.availabilitySlots,
        day
      );
      
      if (!validation.hasConflict) {
        requests.push({
          ...baseRequest,
          dayOfWeek: day
        });
      }
    }

    if (requests.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Slots Available',
        text: 'No slots could be added due to conflicts on all days.',
        confirmButtonColor: '#0a2e65'
      });
      this.isAddingSlot = false;
      return;
    }

   
    let completed = 0;
    let successful = 0;
    
    requests.forEach(request => {
      this.availabilityService.addAvailabilitySlot(request).subscribe({
        next: (newSlot) => {
          this.availabilitySlots.push(newSlot);
          successful++;
          completed++;
          
          if (completed === requests.length) {
            this.weeklySchedule = this.availabilityService.organizeByWeek(this.availabilitySlots);
            this.updateCalendarDays();
            this.isAddingSlot = false;
            this.showAddForm = false;
            
           
            Swal.fire({
              icon: 'success',
              title: 'Recurring Slots Added!',
              text: `${successful} recurring slots added successfully!`,
              timer: 3000,
              showConfirmButton: false,
              toast: true,
              position: 'top-end'
            });
          }
        },
        error: (error) => {
          completed++;
          console.error('Error adding recurring slot:', error);
          
          if (completed === requests.length) {
            this.weeklySchedule = this.availabilityService.organizeByWeek(this.availabilitySlots);
            this.updateCalendarDays();
            this.isAddingSlot = false;
            this.showAddForm = false;
            
            if (successful > 0) {
              Swal.fire({
                icon: 'warning',
                title: 'Partial Success',
                text: `${successful} slots were added, but some failed due to conflicts.`,
                confirmButtonColor: '#0a2e65'
              });
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Failed',
                text: 'No slots could be added due to conflicts.',
                confirmButtonColor: '#0a2e65'
              });
            }
          }
        }
      });
    });
  }

  editSlot(slot: AvailabilitySlot): void {
    this.selectedSlotForEdit = slot;
    this.editSlotForm.patchValue({
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime.substring(0, 5), 
      endTime: slot.endTime.substring(0, 5)
    });
    this.showEditModal = true;
  }

  onUpdateSlot(): void {
    if (this.editSlotForm.valid && this.selectedSlotForEdit) {
      this.isEditingSlot = true;
      const formData = this.editSlotForm.value;
      
      const request: UpdateAvailabilityRequest = {
        dayOfWeek: formData.dayOfWeek,
        startTime: `${formData.startTime}:00`,
        endTime: `${formData.endTime}:00`
      };

    
      const validation = this.availabilityService.validateTimeSlot(
        request.startTime!,
        request.endTime!,
        this.availabilitySlots,
        request.dayOfWeek!,
        this.selectedSlotForEdit.availabilityId
      );

      if (validation.hasConflict) {
        this.isEditingSlot = false;
        
        Swal.fire({
          icon: 'warning',
          title: 'Conflict Detected',
          text: validation.message,
          confirmButtonColor: '#0a2e65'
        });
        return;
      }

      this.availabilityService.updateAvailabilitySlot(this.selectedSlotForEdit.availabilityId, request).subscribe({
        next: (updatedSlot) => {
          const index = this.availabilitySlots.findIndex(s => s.availabilityId === updatedSlot.availabilityId);
          if (index !== -1) {
            this.availabilitySlots[index] = updatedSlot;
          }
          
          this.weeklySchedule = this.availabilityService.organizeByWeek(this.availabilitySlots);
          this.updateCalendarDays();
          this.isEditingSlot = false;
          this.showEditModal = false;
          this.selectedSlotForEdit = null;
          
        
          Swal.fire({
            icon: 'success',
            title: 'Updated!',
            text: 'Availability slot updated successfully!',
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });
        },
        error: (error) => {
          this.isEditingSlot = false;
          console.error('Error updating slot:', error);
          
          Swal.fire({
            icon: 'error',
            title: 'Update Failed',
            text: 'Failed to update availability slot. Please try again.',
            confirmButtonColor: '#0a2e65'
          });
        }
      });
    } else {
      this.markFormGroupTouched(this.editSlotForm);
    }
  }

  deleteSlot(slot: AvailabilitySlot): void {
    Swal.fire({
      title: 'Delete Availability Slot?',
      html: `
        <div class="text-start">
          <p class="mb-2"><strong>Day:</strong> ${slot.dayName}</p>
          <p class="mb-2"><strong>Time:</strong> ${this.formatTime(slot.startTime)} - ${this.formatTime(slot.endTime)}</p>
          <p class="text-muted mb-0">This action cannot be undone.</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '<i class="fas fa-trash me-2"></i>Yes, Delete',
      cancelButtonText: '<i class="fas fa-times me-2"></i>Cancel',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-4',
        confirmButton: 'rounded-pill px-4',
        cancelButton: 'rounded-pill px-4'
      }
    }).then((result) => {
      if (result.isConfirmed) {
       
        Swal.fire({
          title: 'Deleting...',
          text: 'Please wait while we delete your availability slot.',
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        this.availabilityService.deleteAvailabilitySlot(slot.availabilityId).subscribe({
          next: () => {
            this.availabilitySlots = this.availabilitySlots.filter(s => s.availabilityId !== slot.availabilityId);
            this.weeklySchedule = this.availabilityService.organizeByWeek(this.availabilitySlots);
            this.updateCalendarDays();
            
            
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: 'Availability slot has been deleted successfully.',
              timer: 2000,
              showConfirmButton: false,
              toast: true,
              position: 'top-end'
            });
          },
          error: (error) => {
            console.error('Error deleting slot:', error);
            
            Swal.fire({
              icon: 'error',
              title: 'Delete Failed',
              text: 'Failed to delete availability slot. It may have existing bookings.',
              confirmButtonColor: '#0a2e65'
            });
          }
        });
      }
    });
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedSlotForEdit = null;
    this.isEditingSlot = false;
  }

  formatTime(timeString: string): string {
    return this.availabilityService.formatTimeForDisplay(timeString);
  }

  getDaySlots(dayOfWeek: number): AvailabilitySlot[] {
    return this.weeklySchedule[dayOfWeek] || [];
  }

  isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['min']) return `${fieldName} value is too low`;
      if (field.errors['max']) return `${fieldName} value is too high`;
    }
    return '';
  }

  markFormGroupTouched(form: FormGroup): void {
    Object.keys(form.controls).forEach(key => {
      form.get(key)?.markAsTouched();
    });
  }

  
  toggleBulkMode(): void {
    this.bulkAddMode = !this.bulkAddMode;
    if (!this.bulkAddMode) {
      this.selectedDaysForBulk = [false, false, false, false, false, false, false];
    }
  }

  onBulkDayToggle(dayIndex: number): void {
    this.selectedDaysForBulk[dayIndex] = !this.selectedDaysForBulk[dayIndex];
  }

  addBulkSlots(): void {
    const selectedDays = this.selectedDaysForBulk
      .map((selected, index) => selected ? index : -1)
      .filter(day => day !== -1);

    if (selectedDays.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Days Selected',
        text: 'Please select at least one day for bulk adding.',
        confirmButtonColor: '#0a2e65'
      });
      return;
    }

    if (this.addSlotForm.valid) {
      this.isAddingSlot = true;
      const formData = this.addSlotForm.value;
      
      const requests: CreateAvailabilityRequest[] = selectedDays.map(day => ({
        userId: this.currentUserId,
        dayOfWeek: day,
        startTime: `${formData.startTime}:00`,
        endTime: `${formData.endTime}:00`
      }));

     
      Swal.fire({
        title: 'Add Bulk Availability?',
        html: `
          <div class="text-start">
            <p class="mb-2">You're about to add availability for:</p>
            <ul class="list-unstyled">
              ${selectedDays.map(day => `<li><i class="fas fa-calendar-day me-2 text-primary"></i>${this.dayNames[day]}</li>`).join('')}
            </ul>
            <p class="mb-2"><strong>Time:</strong> ${this.availabilityService.formatTimeForDisplay(formData.startTime + ':00')} - ${this.availabilityService.formatTimeForDisplay(formData.endTime + ':00')}</p>
            <p class="text-muted mb-0">Conflicting slots will be skipped.</p>
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#0a2e65',
        cancelButtonColor: '#6c757d',
        confirmButtonText: '<i class="fas fa-plus me-2"></i>Add Slots',
        cancelButtonText: '<i class="fas fa-times me-2"></i>Cancel',
        customClass: {
          popup: 'rounded-4',
          confirmButton: 'rounded-pill px-4',
          cancelButton: 'rounded-pill px-4'
        }
      }).then((result) => {
        if (result.isConfirmed) {
         
          Swal.fire({
            title: 'Adding Slots...',
            text: 'Please wait while we add your availability slots.',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
              Swal.showLoading();
            }
          });

          
          let completed = 0;
          let successful = 0;
          
          requests.forEach(request => {
            const validation = this.availabilityService.validateTimeSlot(
              request.startTime,
              request.endTime,
              this.availabilitySlots,
              request.dayOfWeek
            );

            if (validation.hasConflict) {
              completed++;
              if (completed === requests.length) {
                this.finalizeBulkAdd(successful);
              }
              return;
            }

            this.availabilityService.addAvailabilitySlot(request).subscribe({
              next: (newSlot) => {
                this.availabilitySlots.push(newSlot);
                successful++;
                completed++;
                
                if (completed === requests.length) {
                  this.finalizeBulkAdd(successful);
                }
              },
              error: (error) => {
                completed++;
                console.error('Error adding bulk slot:', error);
                
                if (completed === requests.length) {
                  this.finalizeBulkAdd(successful);
                }
              }
            });
          });
        } else {
          this.isAddingSlot = false;
        }
      });
    } else {
      this.markFormGroupTouched(this.addSlotForm);
    }
  }

  private finalizeBulkAdd(successful: number): void {
    this.weeklySchedule = this.availabilityService.organizeByWeek(this.availabilitySlots);
    this.updateCalendarDays();
    this.isAddingSlot = false;
    this.showAddForm = false;
    this.bulkAddMode = false;
    this.selectedDaysForBulk = [false, false, false, false, false, false, false];
    
    if (successful > 0) {
      Swal.fire({
        icon: 'success',
        title: 'Bulk Add Complete!',
        text: `${successful} slots added successfully!`,
        confirmButtonColor: '#0a2e65'
      });
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'No Slots Added',
        text: 'No slots could be added due to conflicts on all selected days.',
        confirmButtonColor: '#0a2e65'
      });
    }
  }

  
  getDaysWithAvailability(): number {
    return Object.keys(this.weeklySchedule).filter(day => 
      this.weeklySchedule[Number(day)].length > 0
    ).length;
  }

 
  getTotalHours(): number {
    let totalMinutes = 0;
    
    Object.values(this.weeklySchedule).forEach(daySlots => {
      daySlots.forEach((slot: AvailabilitySlot) => { 
        const startMinutes = this.availabilityService.timeStringToMinutes(slot.startTime);
        const endMinutes = this.availabilityService.timeStringToMinutes(slot.endTime);
        totalMinutes += (endMinutes - startMinutes);
      });
    });
    
    return Math.round(totalMinutes / 60 * 10) / 10; 
  }

 
  private timeStringToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }
}
