import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { catchError, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr'; // Ensure ngx-toastr is imported
import { UserProfile } from '../../../Models/User/user-profile';
import { Skill } from '../../../Models/Skills/skill';
import { UserProfileService } from '../../../Services/user-profile.service';
import { UpdateMenteeProfile } from '../../../Models/UserProfile/UpdateMenteeProfileDto';
import { ChangePassword } from '../../../Models/UserProfile/ChangePassword';

@Component({
  selector: 'app-mentee-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './mentee-profile.component.html',
  styleUrls: ['./mentee-profile.component.css'], // Corrected styleUrl to styleUrls
})
export class MenteeProfileComponent implements OnInit {
  userProfile: UserProfile | null = null;
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  allSkills: Skill[] = [];
  selectedSkillIds: number[] = [];
  // Keep these for template compatibility, but toastr will be primary feedback
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;

  selectedFile: File | null = null;
  activeTab = 'profile'; // Default active tab

  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  private loadingToastId: number | null = null; // To manage the loading toast

  constructor(
    private fb: FormBuilder,
    private userProfileService: UserProfileService,
    private toastr: ToastrService // Inject ToastrService
  ) {}

  ngOnInit(): void {
    this.initForms();
    // Load skills first, then profile to ensure proper skill selection
    this.loadSkills().then(() => {
      this.loadUserProfile();
    });
  }

  // --- Core Data Loading ---
  private async loadSkills(): Promise<void> {
    // Show loading toast
    this.loadingToastId = this.toastr.info('Loading skills...', 'Please Wait', {
      disableTimeOut: true,
      tapToDismiss: false,
    }).toastId;

    return new Promise((resolve, reject) => {
      this.userProfileService
        .getSkills()
        .pipe(
          catchError((error) => {
            this.toastr.error(
              `Failed to load available skills: ${error.message}`,
              'Error'
            );
            this.toastr.remove(this.loadingToastId!); // Remove loading toast on error
            reject(error);
            return throwError(() => error);
          })
        )
        .subscribe((skills) => {
          this.allSkills = skills;
          this.toastr.remove(this.loadingToastId!); // Remove loading toast on success
          resolve();
        });
    });
  }

  loadUserProfile(): void {
    // No need for separate isLoading here, Toastr handles it
    this.userProfileService
      .getUserProfile()
      .pipe(
        catchError((error) => {
          this.toastr.error(
            `Failed to load profile: ${error.message}`,
            'Error'
          );
          return throwError(() => error);
        })
      )
      .subscribe((profile) => {
        // Ensure it's a mentee profile
        if (profile.role !== 'Mentee') {
          this.toastr.error('Access Denied: Not a Mentee profile.', 'Error');
          // Optionally redirect if role mismatch, or handle gracefully
          return;
        }
        this.userProfile = profile;
        this.patchProfileForm(profile); // Update selected skills from the fetched userProfile.menteeSkills
        // This is crucial for synchronizing the UI with backend state
        if (this.userProfile.mentorSkills) {
          // Use menteeSkills for mentee
          this.selectedSkillIds = this.userProfile.mentorSkills.map(
            (s: { id: any }) => s.id
          );
        } else {
          this.selectedSkillIds = []; // Clear if no skills
        }
      });
  }

  // --- Form Initialization and Validation ---
  initForms(): void {
    this.profileForm = this.fb.group({
      fullName: ['', Validators.maxLength(100)],
      email: ['', [Validators.email, Validators.maxLength(100)]],
      bio: ['', Validators.maxLength(1000)],
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

  patchProfileForm(profile: UserProfile): void {
    this.profileForm.patchValue({
      fullName: profile.fullName,
      email: profile.email,
      bio: profile.bio,
    });
  }

  // --- Skill Management ---
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

  // --- Profile Picture Upload ---
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        this.toastr.error(
          'Please select an image file (e.g., JPG, PNG).',
          'Validation Error'
        );
        this.selectedFile = null;
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        this.toastr.error('File size exceeds 5MB limit.', 'Validation Error');
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
      this.toastr.warning('No file selected for upload.', 'Warning');
      return;
    }

    this.loadingToastId = this.toastr.info(
      'Uploading photo...',
      'Please Wait',
      { disableTimeOut: true, tapToDismiss: false }
    ).toastId;

    this.userProfileService
      .uploadProfilePictureFile(this.selectedFile)
      .pipe(
        catchError((error) => {
          this.toastr.error(
            `Failed to upload profile picture: ${error.message}`,
            'Error'
          );
          this.toastr.remove(this.loadingToastId!);
          return throwError(() => error);
        })
      )
      .subscribe((uploadedUrl) => {
        if (this.userProfile) {
          this.userProfile.profilePicture = uploadedUrl; // Update displayed picture
        }
        this.selectedFile = null; // Clear selected file
        // Reset file input element
        const fileInput = document.getElementById(
          'profileFileInput'
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = '';

        this.toastr.success(
          'Profile picture uploaded and updated successfully!',
          'Success'
        );
        this.toastr.remove(this.loadingToastId!);
      });
  }

  // --- Profile Data Update ---
  updateProfile(): void {
    if (this.profileForm.invalid) {
      this.toastr.error(
        'Please correct the errors in the profile form.',
        'Validation Error'
      );
      this.markFormGroupTouched(this.profileForm);
      return;
    }

    this.loadingToastId = this.toastr.info(
      'Updating profile...',
      'Please Wait',
      { disableTimeOut: true, tapToDismiss: false }
    ).toastId;

    const updateData: UpdateMenteeProfile = {
      fullName: this.profileForm.get('fullName')?.value,
      email: this.profileForm.get('email')?.value,
      bio: this.profileForm.get('bio')?.value,
      skillIds: this.selectedSkillIds,
    };

    this.userProfileService
      .updateMenteeProfile(updateData)
      .pipe(
        catchError((error) => {
          this.toastr.error(
            `Failed to update profile: ${error.message}`,
            'Error'
          );
          this.toastr.remove(this.loadingToastId!);
          return throwError(() => error);
        })
      )
      .subscribe((updatedProfile) => {
        this.userProfile = updatedProfile; // Synchronize local profile with backend response

        // This is important: Re-update selected skills from the response
        // if the backend might have altered them or to confirm successful save.
        if (this.userProfile.mentorSkills) {
          this.selectedSkillIds = this.userProfile.mentorSkills.map(
            (s: { id: any }) => s.id
          );
        } else {
          this.selectedSkillIds = [];
        }

        this.toastr.success('Profile updated successfully!', 'Success');
        this.toastr.remove(this.loadingToastId!);
      });
  }

  // --- Change Password ---
  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.toastr.error(
        'Please correct the errors in the password form.',
        'Validation Error'
      );
      this.markFormGroupTouched(this.passwordForm);
      return;
    }

    this.loadingToastId = this.toastr.info(
      'Changing password...',
      'Please Wait',
      { disableTimeOut: true, tapToDismiss: false }
    ).toastId;

    const passwordData: ChangePassword = this.passwordForm.value;
    this.userProfileService
      .changePassword(passwordData)
      .pipe(
        catchError((error) => {
          this.toastr.error(
            `Failed to change password: ${error.message}`,
            'Error'
          );
          this.toastr.remove(this.loadingToastId!);
          return throwError(() => error);
        })
      )
      .subscribe(() => {
        this.toastr.success('Password changed successfully!', 'Success');
        this.passwordForm.reset(); // Clear form
        this.toastr.remove(this.loadingToastId!);
        // Reset password visibility states
        this.showCurrentPassword = false;
        this.showNewPassword = false;
        this.showConfirmPassword = false;
      });
  }

  // --- UI/Utility Methods ---
  switchTab(tabName: string): void {
    this.activeTab = tabName;
    // Clear messages when switching tabs for better UX
    this.toastr.clear(); // Clear any lingering toasts
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

  private markFormGroupTouched(formGroup: FormGroup): void {
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
}
