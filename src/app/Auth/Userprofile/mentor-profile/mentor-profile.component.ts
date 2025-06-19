import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserProfile } from '../../../Models/User/user-profile';
import { Skill } from '../../../Models/Skills/skill';
import { UserProfileService } from '../../../Services/user-profile.service';
import { catchError, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { UpdateMentorProfile } from '../../../Models/UserProfile/UpdateMentorProfileDto';
import { ChangePassword } from '../../../Models/UserProfile/ChangePassword';

@Component({
  selector: 'app-mentor-profile',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './mentor-profile.component.html',
  styleUrl: './mentor-profile.component.css'
})
export class MentorProfileComponent {
userProfile: UserProfile | null = null;
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  allSkills: Skill[] = [];
  selectedSkillIds: number[] = [];
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private userProfileService: UserProfileService
  ) {}

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
      hourlyRate: [null as number | null, [Validators.min(0.01), Validators.max(1000)]],
      isInterviewer: [false]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(100),
        Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$')
      ]],
      confirmNewPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
    const newPassword = form.get('newPassword')?.value;
    const confirmNewPassword = form.get('confirmNewPassword')?.value;
    return newPassword === confirmNewPassword ? null : { mismatch: true };
  }

  loadUserProfile(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.userProfileService.getUserProfile().pipe(
      catchError(error => {
        this.errorMessage = `Failed to load profile: ${error.message}`;
        this.isLoading = false;
        return throwError(() => error);
      })
    ).subscribe(profile => {
      // Ensure it's a mentor profile
      if (profile.role !== 'Mentor') {
        this.errorMessage = 'Access Denied: Not a Mentor profile.';
        this.isLoading = false;
        return;
      }
      this.userProfile = profile;
      this.patchProfileForm(profile);
      this.isLoading = false;

      // Set initially selected skills
      if (this.userProfile.mentorSkills && this.allSkills.length > 0) {
        this.selectedSkillIds = this.userProfile.mentorSkills.map((s: { id: any; }) => s.id);
      }
    });
  }

  patchProfileForm(profile: UserProfile): void {
    this.profileForm.patchValue({
      fullName: profile.fullName,
      email: profile.email,
      bio: profile.bio,
      hourlyRate: profile.hourlyRate,
      isInterviewer: profile.isInterviewer
    });
  }

  loadSkills(): void {
    this.userProfileService.getSkills().pipe(
      catchError(error => {
        this.errorMessage = `Failed to load available skills: ${error.message}`;
        return throwError(() => error);
      })
    ).subscribe(skills => {
      this.allSkills = skills;
      if (this.userProfile && this.userProfile.mentorSkills) {
        this.selectedSkillIds = this.userProfile.mentorSkills.map((s: { id: any; }) => s.id);
      }
    });
  }

  onSkillChange(event: any, skillId: number): void {
    if (event.target.checked) {
      if (!this.selectedSkillIds.includes(skillId)) {
        this.selectedSkillIds.push(skillId);
      }
    } else {
      this.selectedSkillIds = this.selectedSkillIds.filter(id => id !== skillId);
    }
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        this.errorMessage = 'Please select an image file (e.g., JPG, PNG).';
        this.selectedFile = null;
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage = 'File size exceeds 5MB limit.';
        this.selectedFile = null;
        return;
      }
      this.selectedFile = file;
      this.errorMessage = '';
    } else {
      this.selectedFile = null;
    }
  }

  uploadProfilePhoto(): void {
    if (!this.selectedFile) {
      this.errorMessage = 'Please select a file to upload.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.userProfileService.uploadProfilePictureFile(this.selectedFile).pipe(
      catchError((error: HttpErrorResponse) => {
        this.errorMessage = `Failed to upload profile picture: ${error.error || error.message}`;
        this.isLoading = false;
        return throwError(() => error);
      })
    ).subscribe(uploadedUrl => {
      if (this.userProfile) {
        this.userProfile.profilePicture = uploadedUrl;
      }
      this.selectedFile = null;
      const fileInput = document.getElementById('profileFileInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      this.successMessage = 'Profile picture uploaded and updated successfully!';
      this.isLoading = false;
    });
  }

  updateProfile(): void {
    if (this.profileForm.invalid) {
      this.errorMessage = 'Please correct the errors in the profile form.';
      this.markFormGroupTouched(this.profileForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const updateData: UpdateMentorProfile = {
      fullName: this.profileForm.get('fullName')?.value,
      email: this.profileForm.get('email')?.value,
      bio: this.profileForm.get('bio')?.value,
      hourlyRate: this.profileForm.get('hourlyRate')?.value,
      isInterviewer: this.profileForm.get('isInterviewer')?.value,
      skillIds: this.selectedSkillIds
    };

    this.userProfileService.updateMentorProfile(updateData).pipe(
      catchError(error => {
        this.errorMessage = `Failed to update profile: ${error.message}`;
        this.isLoading = false;
        return throwError(() => error);
      })
    ).subscribe(updatedProfile => {
      this.userProfile = updatedProfile;
      this.successMessage = 'Profile updated successfully!';
      this.isLoading = false;
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.errorMessage = 'Please correct the errors in the password form.';
      this.markFormGroupTouched(this.passwordForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const passwordData: ChangePassword = this.passwordForm.value;
    this.userProfileService.changePassword(passwordData).pipe(
      catchError(error => {
        this.errorMessage = `Failed to change password: ${error.message}`;
        this.isLoading = false;
        return throwError(() => error);
      })
    ).subscribe(() => {
      this.successMessage = 'Password changed successfully!';
      this.passwordForm.reset();
      this.isLoading = false;
    });
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }

  getControlError(controlName: string, form: FormGroup): string | null {
    const control = form.get(controlName);
    if (control?.invalid && (control.dirty || control.touched)) {
      if (control.errors?.['required']) { return 'This field is required.'; }
      if (control.errors?.['email']) { return 'Invalid email format.'; }
      if (control.errors?.['maxlength']) { return `Too long (max ${control.errors['maxlength'].requiredLength} chars).`; }
      if (control.errors?.['minlength']) { return `Too short (min ${control.errors['minlength'].requiredLength} chars).`; }
      if (control.errors?.['pattern']) {
        if (controlName === 'newPassword') { return 'Password must contain at least 8 chars, one uppercase, one lowercase, one digit, and one special char.'; }
        return 'Invalid format.';
      }
      if (control.errors?.['min'] || control.errors?.['max']) {
        if (controlName === 'hourlyRate') { return 'Hourly rate must be between 0.01 and 1000.00.'; }
      }
    }
    if (controlName === 'confirmNewPassword' && form.errors?.['mismatch'] && (control?.dirty || control?.touched)) {
      return 'Passwords do not match.';
    }
    return null;
  }
}
