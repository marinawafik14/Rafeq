import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../../Services/dashboard.service';
import { DashboardStatus } from '../../../Models/dashboard-status';
import { NGX_ECHARTS_CONFIG, NgxEchartsModule } from 'ngx-echarts';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-charts',
  imports: [CommonModule, NgxEchartsModule],
  standalone: true,
  templateUrl: './charts.component.html',
  styleUrl: './charts.component.css',
  providers: [
    {
      provide: NGX_ECHARTS_CONFIG,
      useValue: { echarts: () => import('echarts') }
    }
  ]
})
export class ChartsComponent implements OnInit {
  revenueChartOptions: any;
  userGrowthChartOptions: any;
  dashboardData: any = {}; // Initialize as object

  constructor(private _dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this._dashboardService.getDashboardStatus().subscribe({
      next: (data: DashboardStatus[]) => {
        this.dashboardData = data[0] || {};
        this.initCharts();
        console.log('Dashboard data loaded successfully', this.dashboardData);
      },
      error: (err) => {
        console.error('Failed to load dashboard data:', err);
      }
    });
  }
initCharts() {
  const now = new Date();
  const months: string[] = [];

  // توليد آخر 12 شهر من الآن
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(date.toLocaleString('default', { month: 'short' })); // "May", "Jun", ...
  }

  const userGrowth = Array.isArray(this.dashboardData.monthlyUserGrowth)
    ? [...this.dashboardData.monthlyUserGrowth]
    : [];
  while (userGrowth.length < 12) userGrowth.unshift(0); // نضيف في البداية لو ناقص

  const monthlyRevenue = Array.isArray(this.dashboardData.monthlyRevenue)
    ? [...this.dashboardData.monthlyRevenue]
    : [];
  while (monthlyRevenue.length < 12) monthlyRevenue.unshift(0); // نضيف في البداية لو ناقص

  this.userGrowthChartOptions = {
    title: { text: 'User Growth (Monthly)', left: 'center' },
    xAxis: { type: 'category', data: months },
    yAxis: { type: 'value' },
    tooltip: { trigger: 'axis' },
    series: [
      {
        data: userGrowth,
        type: 'line',
        smooth: true,
        areaStyle: {},
        name: 'Users'
      }
    ]
  };

  this.revenueChartOptions = {
    title: { text: 'Revenue Trends (Monthly)', left: 'center' },
    xAxis: { type: 'category', data: months },
    yAxis: { type: 'value' },
    tooltip: { trigger: 'axis' },
    series: [
      {
        data: monthlyRevenue,
        type: 'bar',
        name: 'Revenue',
        itemStyle: { color: '#61dafb' }
      }
    ]
  };
}

 
}