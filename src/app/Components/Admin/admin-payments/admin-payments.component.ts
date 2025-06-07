import { Component, NgModule, OnInit } from '@angular/core';
import { PaymentService } from '../../../Services/payment.service';
import { Payments } from '../../../Models/Payments';
import { CommonModule } from '@angular/common';
import { NGX_ECHARTS_CONFIG, NgxEchartsModule } from 'ngx-echarts';

@Component({
  selector: 'app-admin-payments',
   standalone: true,
  imports: [
    CommonModule, NgxEchartsModule],
  templateUrl: './admin-payments.component.html',
  styleUrl: './admin-payments.component.css',
 providers:[
  {provide: NGX_ECHARTS_CONFIG,
      useValue: { echarts: () => import('echarts') }}
 ]

})

export class AdminPaymentsComponent implements OnInit {
  payments: Payments[] = [];
  chartOptions: any;
currentPage : number = 1;
    itemsPerPage: number = 10;
  constructor(private paymentService: PaymentService) { }

  ngOnInit(): void {
    this.getPayments();
  }

  getPayments(): void {
    this.paymentService.getPayments().subscribe({
      next: (data: Payments[]) => {
        this.payments = data;
        this.updateChart();
        console.log(data);
      },
      error: (err) => {
        console.error('Failed to load payments:', err);
      }
    });
  }

  updateChart(): void {
    const grouped = this.groupByMentor(this.payments);
  this.chartOptions = {
    title: { text: 'Total Paid per Mentor', left: 'center' },
    tooltip: {},
    xAxis: {
      type: 'category',
      data: Object.keys(grouped)
    },
    yAxis: {
      type: 'value'
    },
    color: ['#019863', '#FF9800', '#2196F3', '#E91E63', '#9C27B0'], 
    series: [{
      name: 'Amount Paid',
      type: 'bar',
      data: Object.values(grouped),
      barWidth: '40%', 
      itemStyle: {
        borderRadius: [5, 5, 0, 0] 
      }
    }]
  };
  }

 groupByMentor(payments: Payments[]): { [mentor: string]: number } {
  const result: { [mentor: string]: number } = {};
  payments.forEach(p => {
    const mentor = p.mentorFullName ?? 'Unknown';
    result[mentor] = (result[mentor] || 0) + p.amountPaid;
  });
  return result;
}

  getTotalRevenue(): number {
    return this.payments.reduce((total, payment) => total + payment.amountPaid, 0);
  }

// Pagination logic
getpaginatedPayments(): Payments[] {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage; 
        const endIndex = startIndex + this.itemsPerPage;     
        return this.payments.slice(startIndex, endIndex);
        
      }

get totalPages(): number {
    return Math.ceil(this.payments.length / this.itemsPerPage);
  }
  changePage(page: number): void {
    if (page > 0 && page <= this.totalPages) {
      this.currentPage = page;
    }
  } 




}