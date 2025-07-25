import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { FaqService } from '../../Services/faq.service';
import { FaqDto } from '../../Models/FQA/FaqDto';
import { FaqCreateUpdateDto } from '../../Models/FQA/FaqCreateUpdateDto';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-faq-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './faq-form.component.html',
  styleUrls: ['./faq-form.component.css']
})
export class FaqFormComponent implements OnInit {
  faqForm!: FormGroup;
  isEditMode: boolean = false;
  faqId: number | null = null;
  loading: boolean = false;
  categories: string[] = ['General', 'Technical', 'Account', 'Billing', 'Support']; 

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private faqService: FaqService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.initializeForm();

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.faqId = +id;
        this.loadFaqData(this.faqId);
      }
    });
  }

  initializeForm(): void {
    this.faqForm = this.fb.group({
      question: ['', Validators.required],
      answer: ['', Validators.required],
      category: ['', Validators.required], 
      sortOrder: [0, [Validators.required, Validators.min(0)]],
      isActive: [true]
    });
  }

  loadFaqData(id: number): void {
    this.loading = true;
    this.faqService.getFaqByIdForAdmin(id).subscribe({
      next: (faq: FaqDto) => {
        this.faqForm.patchValue({
          question: faq.question,
          answer: faq.answer,
          category: faq.category,
          sortOrder: faq.sortOrder,
          isActive: faq.isActive
        });
        this.loading = false;
      },
      error: (err: any) => {
        Swal.fire({
          icon: 'error',
          title: 'Failed to load FAQ for editing',
          text: err.message || 'Please check console.',
          confirmButtonColor: '#0a2e65'
        });
        console.error('Error loading FAQ:', err);
        this.loading = false;
        this.router.navigate(['/admin/faqs']); 
      }
    });
  }

  onSubmit(): void {
    if (this.faqForm.invalid) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Please fill in all required fields correctly.',
        confirmButtonColor: '#0a2e65'
      });
      this.faqForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const faqData: FaqCreateUpdateDto = this.faqForm.value;

    if (this.isEditMode && this.faqId) {
      this.faqService.updateFaq(this.faqId, faqData).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'FAQ updated successfully!',
            timer: 1500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });
          this.router.navigate(['/admin/faqs']);
        },
        error: (err: any) => {
          Swal.fire({
            icon: 'error',
            title: 'Failed to update FAQ',
            text: err.message || 'An error occurred.',
            confirmButtonColor: '#0a2e65'
          });
          console.error('Error updating FAQ:', err);
          this.loading = false;
        }
      });
    } else {
      this.faqService.createFaq(faqData).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'FAQ created successfully!',
            timer: 1500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });
          this.router.navigate(['/admin/faqs']);
        },
        error: (err: any) => {
          Swal.fire({
            icon: 'error',
            title: 'Failed to create FAQ',
            text: err.message || 'An error occurred.',
            confirmButtonColor: '#0a2e65'
          });
          console.error('Error creating FAQ:', err);
          this.loading = false;
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/admin/faqs']);
  }
}
