import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UserProfile } from '../../../Models/User/user-profile';
import { Skill } from '../../../Models/Skills/skill';
import { UserProfileService } from '../../../Services/user-profile.service';
import { catchError, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { UpdateMentorProfile } from '../../../Models/UserProfile/UpdateMentorProfileDto';
import { ChangePassword } from '../../../Models/UserProfile/ChangePassword';
import { Router } from '@angular/router';

@Component({
  selector: 'app-mentor-profile',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './mentor-profile.component.html',
  styleUrl: './mentor-profile.component.css',
})
export class MentorProfileComponent implements OnInit {
  userProfile: UserProfile | null = null;
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  allSkills: Skill[] = [];
  selectedSkillIds: number[] = [];
  selectedFile: File | null = null;

  // Simple tab management
  activeTab = 'profile';

  // Password visibility toggles
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  // Toast notifications
  toasts: Array<{
    id: number;
    type: 'success' | 'error' | 'info';
    message: string;
  }> = [];
  private toastIdCounter = 0;

  constructor(
    private fb: FormBuilder,
    private userProfileService: UserProfileService,
    private router: Router
  ) {}

  // Toast management methods
  showToast(type: 'success' | 'error' | 'info', message: string): void {
    const id = ++this.toastIdCounter;
    this.toasts.push({ id, type, message });

    // Auto-hide toast after 4 seconds
    setTimeout(() => {
      this.removeToast(id);
    }, 4000);
  }

  removeToast(id: number): void {
    this.toasts = this.toasts.filter((toast) => toast.id !== id);
  }

  ngOnInit(): void {
    this.initForms();
    this.loadSkills();
    this.loadUserProfile();
  }

  initForms(): void {
    this.profileForm = this.fb.group({
      fullName: ['', Validators.maxLength(100)],
      email: ['', [Validators.email, Validators.maxLength(100)]],
      bio: ['', Validators.maxLength(1000)],
      hourlyRate: [
        null as number | null,
        [Validators.min(0.01), Validators.max(1000)],
      ],
      isInterviewer: [false],
    });

    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', Validators.required],
        newPassword: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.maxLength(100),
            Validators.pattern(
              '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'
            ),
          ],
        ],
        confirmNewPassword: ['', Validators.required],
      },
      { validator: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
    const newPassword = form.get('newPassword')?.value;
    const confirmNewPassword = form.get('confirmNewPassword')?.value;
    return newPassword === confirmNewPassword ? null : { mismatch: true };
  }
  loadUserProfile(): void {
    this.userProfileService
      .getUserProfile()
      .pipe(
        catchError((error) => {
          this.showToast('error', `Failed to load profile: ${error.message}`);
          return throwError(() => error);
        })
      )
      .subscribe((profile) => {
        // Ensure it's a mentor profile
        if (profile.role !== 'Mentor') {
          this.showToast('error', 'Access Denied: Not a Mentor profile.');
          return;
        }
        this.userProfile = profile;
        this.patchProfileForm(profile);

        // Set initially selected skills
        if (this.userProfile.mentorSkills && this.allSkills.length > 0) {
          this.selectedSkillIds = this.userProfile.mentorSkills.map(
            (s: { id: any }) => s.id
          );
        }
      });
  }

  patchProfileForm(profile: UserProfile): void {
    this.profileForm.patchValue({
      fullName: profile.fullName,
      email: profile.email,
      bio: profile.bio,
      hourlyRate: profile.hourlyRate,
      isInterviewer: profile.isInterviewer,
    });
  }
  loadSkills(): void {
    this.userProfileService
      .getSkills()
      .pipe(
        catchError((error) => {
          this.showToast(
            'error',
            `Failed to load available skills: ${error.message}`
          );
          return throwError(() => error);
        })
      )
      .subscribe((skills) => {
        this.allSkills = skills;
        if (this.userProfile && this.userProfile.mentorSkills) {
          this.selectedSkillIds = this.userProfile.mentorSkills.map(
            (s: { id: any }) => s.id
          );
        }
      });
  }

  onSkillChange(event: any, skillId: number): void {
    if (event.target.checked) {
      if (!this.selectedSkillIds.includes(skillId)) {
        this.selectedSkillIds.push(skillId);
      }
    } else {
      this.selectedSkillIds = this.selectedSkillIds.filter(
        (id) => id !== skillId
      );
    }
  }
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        this.showToast(
          'error',
          'Please select an image file (e.g., JPG, PNG).'
        );
        this.selectedFile = null;
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.showToast('error', 'File size exceeds 5MB limit.');
        this.selectedFile = null;
        return;
      }
      this.selectedFile = file;
    } else {
      this.selectedFile = null;
    }
  }
  uploadProfilePhoto(): void {
    if (!this.selectedFile) {
      this.showToast('error', 'Please select a file to upload.');
      return;
    }

    this.userProfileService
      .uploadProfilePictureFile(this.selectedFile)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          this.showToast(
            'error',
            `Failed to upload profile picture: ${error.error || error.message}`
          );
          return throwError(() => error);
        })
      )
      .subscribe((uploadedUrl) => {
        if (this.userProfile) {
          this.userProfile.profilePicture = uploadedUrl;
        }
        this.selectedFile = null;
        const fileInput = document.getElementById(
          'profileFileInput'
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = '';

        this.showToast(
          'success',
          'Profile picture uploaded and updated successfully!'
        );
      });
  }
  updateProfile(): void {
    if (this.profileForm.invalid) {
      this.showToast('error', 'Please correct the errors in the profile form.');
      this.markFormGroupTouched(this.profileForm);
      return;
    }

    const updateData: UpdateMentorProfile = {
      fullName: this.profileForm.get('fullName')?.value,
      email: this.profileForm.get('email')?.value,
      bio: this.profileForm.get('bio')?.value,
      hourlyRate: this.profileForm.get('hourlyRate')?.value,
      isInterviewer: this.profileForm.get('isInterviewer')?.value,
      skillIds: this.selectedSkillIds,
    };

    this.userProfileService
      .updateMentorProfile(updateData)
      .pipe(
        catchError((error) => {
          this.showToast('error', `Failed to update profile: ${error.message}`);
          return throwError(() => error);
        })
      )
      .subscribe((updatedProfile) => {
        this.userProfile = updatedProfile;
        this.showToast('success', 'Profile updated successfully!');
      });
  }
  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.showToast(
        'error',
        'Please correct the errors in the password form.'
      );
      this.markFormGroupTouched(this.passwordForm);
      return;
    }

    const passwordData: ChangePassword = this.passwordForm.value;
    this.userProfileService
      .changePassword(passwordData)
      .pipe(
        catchError((error) => {
          this.showToast(
            'error',
            `Failed to change password: ${error.message}`
          );
          return throwError(() => error);
        })
      )
      .subscribe(() => {
        this.showToast('success', 'Password changed successfully!');
        this.passwordForm.reset();
        // Reset password visibility states
        this.showCurrentPassword = false;
        this.showNewPassword = false;
        this.showConfirmPassword = false;
      });
  }
  switchTab(tabName: string): void {
    this.activeTab = tabName;
    // Clear any existing toasts when switching tabs for better UX
    this.toasts = [];
  }

  togglePasswordVisibility(field: 'current' | 'new' | 'confirm'): void {
    switch (field) {
      case 'current':
        this.showCurrentPassword = !this.showCurrentPassword;
        break;
      case 'new':
        this.showNewPassword = !this.showNewPassword;
        break;
      case 'confirm':
        this.showConfirmPassword = !this.showConfirmPassword;
        break;
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }

  getControlError(controlName: string, form: FormGroup): string | null {
    const control = form.get(controlName);
    if (control?.invalid && (control.dirty || control.touched)) {
      if (control.errors?.['required']) {
        return 'This field is required.';
      }
      if (control.errors?.['email']) {
        return 'Invalid email format.';
      }
      if (control.errors?.['maxlength']) {
        return `Too long (max ${control.errors['maxlength'].requiredLength} chars).`;
      }
      if (control.errors?.['minlength']) {
        return `Too short (min ${control.errors['minlength'].requiredLength} chars).`;
      }
      if (control.errors?.['pattern']) {
        if (controlName === 'newPassword') {
          return 'Password must contain at least 8 chars, one uppercase, one lowercase, one digit, and one special char.';
        }
        return 'Invalid format.';
      }
      if (control.errors?.['min'] || control.errors?.['max']) {
        if (controlName === 'hourlyRate') {
          return 'Hourly rate must be between 0.01 and 1000.00.';
        }
      }
    }
    if (
      controlName === 'confirmNewPassword' &&
      form.errors?.['mismatch'] &&
      (control?.dirty || control?.touched)
    ) {
      return 'Passwords do not match.';
    }
    return null;
  }
  goToMentorDashboard(): void {
  this.router.navigate(['/mentor/dashboard']);
}

}
