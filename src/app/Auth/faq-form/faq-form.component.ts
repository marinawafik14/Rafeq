// src/app/Components/Admin/admin-faqs/faq-form/faq-form.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { FaqService } from '../../Services/faq.service';
import { FaqDto } from '../../Models/FQA/FaqDto';
import { FaqCreateUpdateDto } from '../../Models/FQA/FaqCreateUpdateDto';

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
  categories: string[] = ['General', 'Technical', 'Account', 'Billing', 'Support']; // Hardcoded categories for example

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
      category: ['', Validators.required], // Category is now required for select
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
        this.toastr.error(err.message || 'Failed to load FAQ for editing.', 'Error');
        console.error('Error loading FAQ:', err);
        this.loading = false;
        this.router.navigate(['/admin/faqs']); // Redirect on error
      }
    });
  }

  onSubmit(): void {
    if (this.faqForm.invalid) {
      this.toastr.warning('Please fill in all required fields correctly.', 'Validation Error');
      this.faqForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const faqData: FaqCreateUpdateDto = this.faqForm.value;

    if (this.isEditMode && this.faqId) {
      this.faqService.updateFaq(this.faqId, faqData).subscribe({
        next: () => {
          this.toastr.success('FAQ updated successfully!', 'Success');
          this.router.navigate(['/admin/faqs']);
        },
        error: (err: any) => {
          this.toastr.error(err.message || 'Failed to update FAQ.', 'Error');
          console.error('Error updating FAQ:', err);
          this.loading = false;
        }
      });
    } else {
      this.faqService.createFaq(faqData).subscribe({
        next: () => {
          this.toastr.success('FAQ created successfully!', 'Success');
          this.router.navigate(['/admin/faqs']);
        },
        error: (err: any) => {
          this.toastr.error(err.message || 'Failed to create FAQ.', 'Error');
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
