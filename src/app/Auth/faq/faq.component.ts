import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FaqDto } from '../../Models/FQA/FaqDto';
import { FaqCategoryDto } from '../../Models/FQA/FaqCategoryDto';
import { FaqService } from '../../Services/faq.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-faq',
  imports: [CommonModule, FormsModule],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.css'
})
export class FaqComponent implements OnInit {
 allFaqs: FaqDto[] = []; // All fetched FAQs
  filteredFaqs: FaqDto[] = []; // FAQs currently displayed (after filter/search)
  categories: FaqCategoryDto[] = [];
  searchQuery: string = '';
  currentCategoryFilter: string | undefined;
  expandedFaqId: number | null = null; // Tracks the currently open FAQ item
  loading: boolean = true;

  constructor(
    private faqService: FaqService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadFaqCategories();
    this.loadFaq();
  }

  loadFaqCategories(): void {
    this.faqService.getFaqCategories().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: (err) => {
        this.toastr.error(err.message || 'Failed to load FAQ categories.', 'Error');
        console.error('Error loading FAQ categories:', err);
      }
    });
  }

  loadFaq(category?: string): void {
    this.loading = true;
    this.faqService.getFaq(category).subscribe({
      next: (data) => {
        this.allFaqs = data;
        this.applyFilterAndSearch();
        this.loading = false;
      },
      error: (err) => {
        this.toastr.error(err.message || 'Failed to load FAQs.', 'Error');
        console.error('Error loading FAQs:', err);
        this.loading = false;
      }
    });
  }

  filterByCategory(category?: string): void {
    this.currentCategoryFilter = category;
    this.applyFilterAndSearch();
  }

  onSearch(): void {
    this.applyFilterAndSearch();
  }

  private applyFilterAndSearch(): void {
    let tempFaqs = [...this.allFaqs];

    if (this.currentCategoryFilter) {
      tempFaqs = tempFaqs.filter(faq => faq.category === this.currentCategoryFilter);
    }

    if (this.searchQuery) {
      const lowerCaseQuery = this.searchQuery.toLowerCase();
      tempFaqs = tempFaqs.filter(faq =>
        faq.question.toLowerCase().includes(lowerCaseQuery) ||
        faq.answer.toLowerCase().includes(lowerCaseQuery)
      );
    }
    this.filteredFaqs = tempFaqs;
  }

  toggleFaq(faqId: number): void {
    this.expandedFaqId = this.expandedFaqId === faqId ? null : faqId;
  }
}
