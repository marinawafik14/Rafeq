import { Component, OnInit } from '@angular/core';
import { BookingService } from '../../../Services/booking.service';
import { Bookings } from '../../../Models/Bookings';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-bookings',
  imports: [CommonModule , FormsModule],
  templateUrl: './admin-bookings.component.html',
  styleUrl: './admin-bookings.component.css'
})
export class AdminBookingsComponent implements OnInit {
  bookings : Bookings[] = [];
  
  // Add Math property for template access
  Math = Math;
  
searchQuery: string = '';
StatusFilter: string = '';
paymentStatusFilter : string = '';
dateSort: string = 'newest';
  //status: string = 'Pending'
  currentPage : number = 1;
    itemsPerPage: number = 10;
constructor( private _bookingService: BookingService){}
  ngOnInit(): void {
    this.getAllBookings();
  }

getAllBookings() {
 return  this._bookingService.getAllBookings().subscribe({

    next :(date)=>{
      console.log(date);
      this.bookings = date;
    }
  });
}

//search sorting and filtering logic
 get filteredBookings(): Bookings[] {
  const query = this.searchQuery.trim().toLowerCase();
  return this.bookings
    .filter(booking => {
      const mentorName = booking.mentorName?.toLowerCase() || '';
      const menteeName = booking.menteeName?.toLowerCase() || '';
      const status = booking.status?.toLowerCase() || '';
      const paymentStatus = booking.paymentStatus?.toLowerCase() || '';

      const matchesStatus = this.StatusFilter ? status === this.StatusFilter.toLowerCase() : true;
      const matchesPaymentStatus = this.paymentStatusFilter ? paymentStatus === this.paymentStatusFilter.toLowerCase() : true;
      const matchesQuery = query ? (mentorName.includes(query) || menteeName.includes(query)) : true;

      return matchesStatus && matchesPaymentStatus && matchesQuery;
    })
    .sort((a, b) => {
      if (this.dateSort === 'newest') {
        return new Date(b.startDateTime ?? '').getTime() - new Date(a.startDateTime ?? '').getTime();
      } else {
        return new Date(a.startDateTime ?? '').getTime() - new Date(b.startDateTime ?? '').getTime();
      }
    });
}
// Pagination logic
getpaginatedBookings(): Bookings[] {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage; 
        const endIndex = startIndex + this.itemsPerPage;     
        return this.filteredBookings.slice(startIndex, endIndex);
        
      }

get totalPages(): number {
    return Math.ceil(this.filteredBookings.length / this.itemsPerPage);
  }
  changePage(page: number): void {
    if (page > 0 && page <= this.totalPages) {
      this.currentPage = page;
    }
  } 

// Add the missing stats methods
getPendingBookings(): number {
  return this.filteredBookings.filter(booking => 
    booking.status?.toLowerCase() === 'pending'
  ).length;
}

getCompletedBookings(): number {
  return this.filteredBookings.filter(booking => 
    booking.status?.toLowerCase() === 'completed'
  ).length;
}

getCancelledBookings(): number {
  return this.filteredBookings.filter(booking => 
    booking.status?.toLowerCase() === 'cancelled'
  ).length;
}

// Add the missing action methods
refreshBookings(): void {
  this.getAllBookings();
}

exportBookings(): void {
  // Simple CSV export functionality
  const csvData = this.filteredBookings.map(booking => ({
    'Session Type': booking.sessionType,
    'Mentor': booking.mentorName,
    'Mentee': booking.menteeName,
    'Status': booking.status,
    'Amount': booking.totalAmount,
    'Commission': booking.commission,
    'Payment Status': booking.paymentStatus
  }));
  
  const csvContent = this.convertToCSV(csvData);
  this.downloadCSV(csvContent, 'bookings-export.csv');
}

private convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvArray = [headers.join(',')];
  
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header] || '';
      return `"${value.toString().replace(/"/g, '""')}"`;
    });
    csvArray.push(values.join(','));
  });
  
  return csvArray.join('\n');
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

// Keep all existing status check methods
isCompleted(status: string): boolean {
  return status?.toLowerCase() === 'completed';
}
isConfirmed(status: string): boolean {
  return status?.toLowerCase() === 'confirmed';
}
isPending(status: string): boolean {
  return status?.toLowerCase() === 'pending';
}
isCancelled(status: string): boolean {
  return status?.toLowerCase() === 'cancelled';
}
isPaid(paymentStatus: string): boolean {
  return paymentStatus?.toLowerCase() === 'paid';
}
isUnpaid(paymentStatus: string): boolean {
  return paymentStatus?.toLowerCase() === 'unpaid';
}

}
