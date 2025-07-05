import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { FaqDto, PagedResult } from '../../Models/FQA/FaqDto';
import { FaqService } from '../../Services/faq.service';

@Component({
  selector: 'app-admin-faq-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-faq-list.component.html',
  styleUrls: ['./admin-faq-list.component.css']
})
export class AdminFaqListComponent implements OnInit {
  faqs: FaqDto[] = [];
  pagedResult: PagedResult<FaqDto> | null = null;
  pageNumber: number = 1;
  pageSize: number = 10;
  searchQuery: string = '';
  category: string = '';
  loading: boolean = false;
  error: string | null = null;

  constructor(private faqService: FaqService, private toastr: ToastrService) { }

  ngOnInit(): void {
    this.loadFaqs();
  }

  loadFaqs(): void {
    this.loading = true;
    this.error = null;
    this.faqService.getAllFaqsForAdmin(this.pageNumber, this.pageSize, this.category, this.searchQuery)
      .subscribe({
        next: (data: PagedResult<FaqDto>) => {
          this.pagedResult = data;
          this.faqs = data.items;
          this.loading = false;
        },
        error: (err: any) => {
          console.error('Error loading FAQs for admin:', err);
          this.error = 'Failed to load FAQs. Please check console for details.';
          this.toastr.error(err.message || 'Failed to load FAQs.', 'Error');
          this.loading = false;
        }
      });
  }

  onPageChange(newPage: number): void {
    if (this.pagedResult && newPage >= 1 && newPage <= this.pagedResult.totalPages) {
      this.pageNumber = newPage;
      this.loadFaqs();
    }
  }

  onSearch(): void {
    this.pageNumber = 1;
    this.loadFaqs();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.category = '';
    this.pageNumber = 1;
    this.loadFaqs();
  }

  deleteFaq(id: number): void {
    if (confirm('Are you sure you want to delete this FAQ? This action cannot be undone.')) {
      this.faqService.deleteFaq(id).subscribe({
        next: () => {
          this.toastr.success('FAQ deleted successfully!', 'Success');
          this.loadFaqs();
        },
        error: (err: any) => {
          console.error('Error deleting FAQ:', err);
          this.error = 'Failed to delete FAQ. Please try again.';
          this.toastr.error(err.message || 'Failed to delete FAQ.', 'Error');
        }
      });
    }
  }

  get totalPagesArray(): number[] {
    if (!this.pagedResult) return [];
    return Array.from({ length: this.pagedResult.totalPages }, (_, i) => i + 1);
  }
}
