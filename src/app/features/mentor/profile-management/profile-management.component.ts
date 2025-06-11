import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProfileService } from '../../../Services/profile.service';
import { UserProfile } from '../../../Models/User/user-profile';
import { Skill } from '../../../Models/Skills/skill';
import { UserSkill } from '../../../Models/Skills/user-skill';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-profile-management',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile-management.component.html',
  styleUrls: ['./profile-management.component.css']
})
export class ProfileManagementComponent implements OnInit {
  profileForm: FormGroup;
  userProfile: UserProfile | null = null;
  availableSkills: Skill[] = [];
  userSkills: UserSkill[] = [];
  filteredSkills: Skill[] = [];
  skillSearchTerm: string = '';
  isLoading: boolean = true;
  isUpdating: boolean = false;
  isUploadingImage: boolean = false;
  error: string | null = null;
  selectedFile: File | null = null;
  imagePreview: string | null = null;

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private toastr: ToastrService
  ) {
    this.profileForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      bio: ['', [Validators.maxLength(1000)]],
      hourlyRate: ['', [Validators.min(1), Validators.max(1000)]],
      isInterviewer: [false]
    });
  }

  ngOnInit(): void {
    this.loadProfileData();
  }

  loadProfileData(): void {
    this.isLoading = true;
    
    // Load profile
    this.profileService.getUserProfile().subscribe({
      next: (profile) => {
        this.userProfile = profile;
        this.populateForm(profile);
        this.imagePreview = profile.profilePicture || null;
      },
      error: (error) => {
        this.error = 'Failed to load profile data';
        console.error('Error loading profile:', error);
      }
    });

    // Load available skills
    this.profileService.getAllSkills().subscribe({
      next: (skills) => {
        this.availableSkills = skills;
        this.filteredSkills = skills;
      },
      error: (error) => {
        console.error('Error loading skills:', error);
      }
    });

    // Load user's skills
    this.profileService.getUserSkills().subscribe({
      next: (userSkills) => {
        this.userSkills = userSkills;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading user skills:', error);
        this.isLoading = false;
      }
    });
  }

  populateForm(profile: UserProfile): void {
    this.profileForm.patchValue({
      fullName: profile.fullName,
      bio: profile.bio || '',
      hourlyRate: profile.hourlyRate || '',
      isInterviewer: profile.isInterviewer
    });
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      this.isUpdating = true;
      const formData = this.profileForm.value;
      
      this.profileService.updateProfile(formData).subscribe({
        next: (updatedProfile) => {
          this.userProfile = updatedProfile;
          this.isUpdating = false;
          this.toastr.success('Profile updated successfully!', 'Success');
        },
        error: (error) => {
          this.isUpdating = false;
          this.toastr.error('Failed to update profile', 'Error');
          console.error('Error updating profile:', error);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  uploadImage(): void {
    if (this.selectedFile) {
      this.isUploadingImage = true;
      
      this.profileService.uploadProfilePicture(this.selectedFile).subscribe({
        next: (imageUrl) => {
          this.isUploadingImage = false;
          this.imagePreview = imageUrl;
          this.toastr.success('Profile picture updated successfully!', 'Success');
          
          // Update the form
          this.profileForm.patchValue({ profilePicture: imageUrl });
          this.selectedFile = null;
        },
        error: (error) => {
          this.isUploadingImage = false;
          this.toastr.error('Failed to upload image', 'Error');
          console.error('Error uploading image:', error);
        }
      });
    }
  }

  filterSkills(): void {
    if (!this.skillSearchTerm.trim()) {
      this.filteredSkills = this.availableSkills;
    } else {
      this.filteredSkills = this.availableSkills.filter(skill =>
        skill.name.toLowerCase().includes(this.skillSearchTerm.toLowerCase()) &&
        !this.userSkills.some(userSkill => userSkill.skillId === skill.id)
      );
    }
  }

  addSkill(skill: Skill): void {
    this.profileService.addSkillToUser(skill.id).subscribe({
      next: (updatedSkills) => {
        this.userSkills = updatedSkills;
        this.toastr.success(`${skill.name} added to your skills!`, 'Success');
        this.skillSearchTerm = '';
        this.filterSkills();
      },
      error: (error) => {
        this.toastr.error('Failed to add skill', 'Error');
        console.error('Error adding skill:', error);
      }
    });
  }

  removeSkill(userSkill: UserSkill): void {
    this.profileService.removeSkillFromUser(userSkill.skillId).subscribe({
      next: (updatedSkills) => {
        this.userSkills = updatedSkills;
        this.toastr.success(`${userSkill.skillName} removed from your skills!`, 'Success');
        this.filterSkills();
      },
      error: (error) => {
        this.toastr.error('Failed to remove skill', 'Error');
        console.error('Error removing skill:', error);
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.profileForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.profileForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['minlength']) return `${fieldName} is too short`;
      if (field.errors['maxlength']) return `${fieldName} is too long`;
      if (field.errors['min']) return `${fieldName} must be greater than 0`;
      if (field.errors['max']) return `${fieldName} is too high`;
    }
    return '';
  }

  markFormGroupTouched(): void {
    Object.keys(this.profileForm.controls).forEach(key => {
      this.profileForm.get(key)?.markAsTouched();
    });
  }
}
