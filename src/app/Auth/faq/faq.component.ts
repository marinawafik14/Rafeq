import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { FaqDto, PagedResult } from '../../Models/FQA/FaqDto';
import { FaqCategoryDto } from '../../Models/FQA/FaqCategoryDto';
import { FaqService } from '../../Services/faq.service';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.css'
})
export class FaqComponent implements OnInit {
  filteredFaqs: FaqDto[] = [];
  categories: FaqCategoryDto[] = [];
  searchQuery: string = '';
  currentCategoryFilter: string | undefined;

  expandedFaqId: number | null = null;
  loading: boolean = true;

  currentPage: number = 1;
  pageSize: number = 10;
  totalFaqs: number = 0;
  totalPages: number = 0;

  constructor(
    private faqService: FaqService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFaqCategories();
    this.loadFaqs();
  }

  loadFaqCategories(): void {
    this.faqService.getFaqCategories().subscribe({
      next: (data: FaqCategoryDto[]) => {
        this.categories = data;
      },
      error: (err: any) => {
        this.toastr.error(err.message || 'Failed to load FAQ categories.', 'Error');
        console.error('Error loading FAQ categories:', err);
      }
    });
  }

  loadFaqs(): void {
    this.loading = true;
    this.faqService.getFaq(
      this.currentCategoryFilter,
      this.searchQuery,
      this.currentPage,
      this.pageSize
    ).subscribe({
      next: (pagedResult: PagedResult<FaqDto>) => {
        this.filteredFaqs = pagedResult.items;
        this.totalFaqs = pagedResult.totalCount;
        this.totalPages = pagedResult.totalPages;
        this.loading = false;
      },
      error: (err: any) => {
        this.toastr.error(err.message || 'Failed to load FAQs.', 'Error');
        console.error('Error loading FAQs:', err);
        this.loading = false;
        this.filteredFaqs = [];
        this.totalFaqs = 0;
        this.totalPages = 0;
      }
    });
  }

  filterByCategory(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const category = selectElement.value;
    this.currentCategoryFilter = (category === '' ? undefined : category);
    this.currentPage = 1;
    this.loadFaqs();
    this.expandedFaqId = null;
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadFaqs();
    this.expandedFaqId = null;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadFaqs();
      this.expandedFaqId = null;
    }
  }

  get pagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  showAllFaqs(): void {
    this.currentCategoryFilter = undefined;
    this.searchQuery = '';
    this.currentPage = 1;
    this.loadFaqs();
    this.expandedFaqId = null;
  }

  toggleFaq(faqId: number): void {
    if (this.expandedFaqId !== faqId) {
      this.faqService.incrementFaqViewCount(faqId).subscribe({
        next: () => {
          const faqToUpdate = this.filteredFaqs.find(f => f.faqId === faqId);
          if (faqToUpdate) {
            faqToUpdate.viewCount++;
          }
        },
        error: (err) => {
          console.error('Error incrementing FAQ view count:', err);
        }
      });
    }
    this.expandedFaqId = this.expandedFaqId === faqId ? null : faqId;
  }

  markFaqAsHelpful(faqId: number, event: Event): void {
    event.stopPropagation();
    this.faqService.incrementFaqHelpfulCount(faqId).subscribe({
      next: () => {
        const faq = this.filteredFaqs.find(f => f.faqId === faqId);
        if (faq) {
          faq.helpfulCount++;
          this.toastr.success('Thank you for your feedback!', 'Helpful');
        }
      },
      error: (err) => {
        this.toastr.error('Failed to register feedback.', 'Error');
        console.error('Error marking FAQ as helpful:', err);
      }
    });
  }

  markFaqAsNotHelpful(faqId: number, event: Event): void {
    event.stopPropagation();
    this.faqService.incrementFaqNotHelpfulCount(faqId).subscribe({
      next: () => {
        const faq = this.filteredFaqs.find(f => f.faqId === faqId);
        if (faq) {
          faq.notHelpfulCount++;
          this.toastr.info('Thank you for your feedback!', 'Not Helpful');
        }
      },
      error: (err) => {
        this.toastr.error('Failed to register feedback.', 'Error');
        console.error('Error marking FAQ as not helpful:', err);
      }
    });
  }

  goToContactPage(): void {
    this.router.navigate(['/contact']);
  }

  goToChatPage(): void {
    this.router.navigate(['/chat']);
  }
}
