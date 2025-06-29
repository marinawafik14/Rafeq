import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FaqDto } from '../../Models/FQA/FaqDto'; // Assuming this path
import { FaqCategoryDto } from '../../Models/FQA/FaqCategoryDto'; // Assuming this path
import { FaqService } from '../../Services/faq.service'; // Assuming this path
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-faq',
  standalone: true, // Assuming standalone component
  imports: [CommonModule, FormsModule],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.css'
})
export class FaqComponent implements OnInit {
  allFaqs: FaqDto[] = []; // All fetched FAQs
  filteredFaqs: FaqDto[] = []; // FAQs currently displayed (after filter/search)
  categories: FaqCategoryDto[] = [];
  searchQuery: string = '';
  currentCategoryFilter: string | undefined; // This will hold the selected category string or undefined
  expandedFaqId: number | null = null; // Tracks the currently open FAQ item
  loading: boolean = true;

  constructor(
    private faqService: FaqService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadFaqCategories();
    this.loadFaq(); // Load all FAQs initially
  }

  loadFaqCategories(): void {
    this.faqService.getFaqCategories().subscribe({
      next: (data) => {
        this.categories = data;
        // Optional: If you want to explicitly set a default 'All' category at the start of your categories array:
        // this.categories.unshift({ categoryName: 'All', questionCount: this.allFaqs.length });
      },
      error: (err) => {
        this.toastr.error(err.message || 'Failed to load FAQ categories.', 'Error');
        console.error('Error loading FAQ categories:', err);
      }
    });
  }

  // loadFaq() now always loads all FAQs, and filtering happens locally
  loadFaq(): void {
    this.loading = true;
    // Assuming getFaq() without a parameter fetches all FAQs
    this.faqService.getFaq().subscribe({ // No category parameter here, as we filter locally
      next: (data) => {
        this.allFaqs = data;
        this.applyFilterAndSearch(); // Apply initial filter and search
        this.loading = false;
      },
      error: (err) => {
        this.toastr.error(err.message || 'Failed to load FAQs.', 'Error');
        console.error('Error loading FAQs:', err);
        this.loading = false;
      }
    });
  }

  // This method is called when the select dropdown value changes
  filterByCategory(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const category = selectElement.value;
    // If the value from the select is an empty string, treat it as undefined for "All Categories"
    this.currentCategoryFilter = (category === '' ? undefined : category);
    this.applyFilterAndSearch();
    this.expandedFaqId = null; // Close any open FAQ when filter changes
  }

  onSearch(): void {
    this.applyFilterAndSearch();
    this.expandedFaqId = null; // Close any open FAQ when search changes
  }

  applyFilterAndSearch(): void {
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
    // Sort the filtered FAQs by SortOrder, then by FAQId
    this.filteredFaqs = tempFaqs.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a.faqId - b.faqId);
  }

  // Reset filters and show all FAQs
  showAllFaqs(): void {
    this.currentCategoryFilter = undefined;
    this.searchQuery = '';
    this.applyFilterAndSearch();
    this.expandedFaqId = null;
  }

  toggleFaq(faqId: number): void {
    this.expandedFaqId = this.expandedFaqId === faqId ? null : faqId;
  }
}
