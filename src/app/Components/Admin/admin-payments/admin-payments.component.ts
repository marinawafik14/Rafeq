import { Component, NgModule, OnInit } from '@angular/core';
import { PaymentService } from '../../../Services/payment.service';
import { Payments } from '../../../Models/Payments/Payments';
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
    const mentor = p.mentorName ?? 'Unknown';
    result[mentor] = (result[mentor] || 0) + p.amountPaid;
  });
  return result;
}

  getTotalRevenue(): number {
    return this.payments.reduce((total, payment) => total + payment.amountPaid, 0);
  }

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

  Math = Math;

  getAveragePayment(): string {
    if (this.payments.length === 0) return '0';
    const total = this.getTotalRevenue();
    const average = total / this.payments.length;
    return average.toFixed(0);
  }

  getTodayRevenue(): string {
  const today = new Date();
  const todayPayments = this.payments.filter(payment => {
    if (!payment.paymentDate) {
      return false; 
    }
    
    const paymentDate = new Date(payment.paymentDate);
    
    if (isNaN(paymentDate.getTime())) {
      return false; 
    }
    
    return paymentDate.toDateString() === today.toDateString();
  });
  
  const todayTotal = todayPayments.reduce((sum, payment) => sum + payment.amountPaid, 0);
  return todayTotal.toFixed(0);
}

  exportPayments(): void {
    if (!this.payments || this.payments.length === 0) {
      window.alert('No payments to export.');
      return;
    }
    const csvData = this.payments.map(payment => ({
      'Mentor Name': payment.mentorName || '',
      'Mentee Name': payment.menteeName || '',
      'Amount Paid': payment.amountPaid,
      'Payment Date': payment.paymentDate || ''
    }));
    const csvContent = this.convertToCSV(csvData);
    this.downloadCSV(csvContent, 'payments-export.csv');
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';
    const header = Object.keys(data[0]).join(',');
    const rows = data.map(row =>
      Object.values(row).map(value =>
        typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      ).join(',')
    );
    return [header, ...rows].join('\n');
  }

  private downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}