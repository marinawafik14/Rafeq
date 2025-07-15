import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { FaqDto, PagedResult } from '../../Models/FQA/FaqDto';
import { FaqService } from '../../Services/faq.service';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-faq-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-faq-list.component.html',
  styleUrls: ['./admin-faq-list.component.css'],
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

  private searchSubject = new Subject<string>();
  private categorySubject = new Subject<string>();

  constructor(private faqService: FaqService, private toastr: ToastrService) {}

  ngOnInit(): void {
    this.loadFaqs();
    this.setupAutoFiltering();
  }

  setupAutoFiltering(): void {
    this.searchSubject
      .pipe(
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe((searchTerm) => {
        this.searchQuery = searchTerm;
        this.pageNumber = 1;
        this.loadFaqs();
      });

    this.categorySubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((categoryTerm) => {
        this.category = categoryTerm;
        this.pageNumber = 1;
        this.loadFaqs();
      });
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchSubject.next(target.value);
  }

  onCategoryInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.categorySubject.next(target.value);
  }

  clearAllFilters(): void {
    this.searchQuery = '';
    this.category = '';
    this.pageNumber = 1;
    this.loadFaqs();
  }

  loadFaqs(): void {
    this.loading = true;
    this.error = null;
    this.faqService
      .getAllFaqsForAdmin(
        this.pageNumber,
        this.pageSize,
        this.category,
        this.searchQuery
      )
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
        },
      });
  }

  onPageChange(newPage: number): void {
    if (
      this.pagedResult &&
      newPage >= 1 &&
      newPage <= this.pagedResult.totalPages
    ) {
      this.pageNumber = newPage;
      this.loadFaqs();
    }
  }

  deleteFaq(id: number): void {
    const faq = this.faqs.find((f) => f.faqId === id);
    const faqTitle = faq ? faq.question : 'this FAQ';

    Swal.fire({
      title: 'Delete FAQ?',
      text: `Are you sure you want to delete "${faqTitle}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-4',
        confirmButton: 'rounded-pill px-4',
        cancelButton: 'rounded-pill px-4'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.faqService.deleteFaq(id).subscribe({
          next: () => {
            this.loadFaqs();
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: `FAQ "${faqTitle}" has been deleted.`,
              timer: 1500,
              showConfirmButton: false,
              toast: true,
              position: 'top-end'
            });
          },
          error: (err: any) => {
            console.error('Error deleting FAQ:', err);
            Swal.fire({
              icon: 'error',
              title: 'Failed to Delete',
              text: err.message || 'Unknown error',
              confirmButtonColor: '#0a2e65'
            });
          },
        });
      }
    });
  }

  get totalPagesArray(): number[] {
    if (!this.pagedResult) return [];
    return Array.from({ length: this.pagedResult.totalPages }, (_, i) => i + 1);
  }

  get filteredResultsInfo(): string {
    if (!this.pagedResult) return '';

    const { totalCount, pageNumber, pageSize, totalPages } = this.pagedResult;
    const startItem = (pageNumber - 1) * pageSize + 1;
    const endItem = Math.min(pageNumber * pageSize, totalCount);

    let info = `Showing ${startItem}-${endItem} of ${totalCount} FAQs`;

    if (this.searchQuery || this.category) {
      const filters = [];
      if (this.searchQuery) filters.push(`search: "${this.searchQuery}"`);
      if (this.category) filters.push(`category: "${this.category}"`);
      info += ` (filtered by ${filters.join(', ')})`;
    }

    return info;
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
    this.categorySubject.complete();
  }
}
