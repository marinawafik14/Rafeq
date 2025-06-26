// src/app/components/auth/register/register.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { AuthService } from '../../Services/auth.service';
import { RegisterDto } from '../../Models/Auth/RegisterDto ';
import { RegisterResponseDto } from '../../Models/Auth/RegisterResponseDto';
import { passwordsMatchValidator } from '../../shared/validators/password-match.validator';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.registerForm = new FormGroup(
      {
        fullName: new FormControl('', [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100),
          Validators.pattern('[a-zA-Z ]*'),
        ]),
        email: new FormControl('', [Validators.required, Validators.email]),
        password: new FormControl('', [
          Validators.required,
          Validators.minLength(6),
        ]),
        confirmPassword: new FormControl('', [Validators.required]),
        role: new FormControl('Mentee', [Validators.required]),
      },
      {
        validators: passwordsMatchValidator('password', 'confirmPassword'),
      }
    );
  }

  get fullName() {
    return this.registerForm.get('fullName');
  }
  get email() {
    return this.registerForm.get('email');
  }
  get password() {
    return this.registerForm.get('password');
  }
  get confirmPassword() {
    return this.registerForm.get('confirmPassword');
  }
  get role() {
    return this.registerForm.get('role');
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.toastr.error(
        'Please correct the errors in the form.',
        'Validation Error'
      );
      return;
    }

    const registerDto: RegisterDto = this.registerForm.value as RegisterDto;

    this.authService.register(registerDto).subscribe({
      next: (response: RegisterResponseDto) => {
        if (response.isSuccess) {
          this.toastr.success(response.message, 'Registration Success');
          this.router.navigate(['/login']);
        } else {
          if (response.isEmailAlreadyRegistered) {
            this.toastr.warning(response.message, 'Email Already Registered');
          } else {
            this.toastr.warning(
              response.message ||
                'Registration successful, but there was an issue sending the verification email.',
              'Registration Warning'
            );
            this.router.navigate(['/login']);
          }
        }
      },
      error: (err: any) => {
        this.toastr.error(
          err.message ||
            'An unexpected error occurred during registration. try again',
          'Error'
        );
        console.error('Registration API error:', err);
      },
    });
  }
}
