import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/supabase.service';
import { ButtonComponent } from '../../core/ui/components/button/button.component';
import { SpinnerComponent } from '../../core/ui/components/spinner/spinner.component';

@Component({
  selector: 'app-employee-monthly-report',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ButtonComponent,
    SpinnerComponent
  ],
  templateUrl: './employee-monthly-report.component.html',
  styleUrls: ['./employee-monthly-report.component.scss']
})
export class EmployeeMonthlyReportComponent implements OnInit {
  loading = false;
  loadingReport = false;
  error = '';
  users: any[] = [];
  years: number[] = [];
  months: {id: number, name: string}[] = [];
  
  form = {
    user_id: '',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  };

  reportData: any[] = [];
  totalHours = 0;
  
  // Salary data
  salaryData: any = null;
  loadingSalary = false;
  salaryError = '';

  constructor(private sb: SupabaseService) {
    // Initialize years (current year and 2 years before/after)
    const currentYear = new Date().getFullYear();
    this.years = Array.from({length: 5}, (_, i) => currentYear - 2 + i);
    
    // Initialize months
    this.months = Array.from({length: 12}, (_, i) => ({
      id: i + 1,
      name: new Date(2000, i, 1).toLocaleString('ar-EG', { month: 'long' })
    }));
  }

  async ngOnInit() {
    await this.loadUsers();
  }

  async loadUsers() {
    this.loading = true;
    this.error = '';
    try {
      const { data, error } = await this.sb.rpc('users_get');
      
      if (error) throw error;
      this.users = data || [];
    } catch (e: any) {
      this.error = e?.message ?? 'فشل في تحميل المستخدمين';
    } finally {
      this.loading = false;
    }
  }

  async generateReport() {
    if (!this.form.user_id) {
      this.error = 'الرجاء اختيار الموظف';
      return;
    }

    console.log('Starting report generation...');
    this.loadingReport = true;
    this.loadingSalary = true;
    this.error = '';
    this.salaryError = '';
    this.salaryData = null;
    this.reportData = [];
    
    try {
      console.log('Fetching report for:', {
        user_id: this.form.user_id,
        year: this.form.year,
        month: this.form.month
      });

      // Call the RPC function
      const { data, error } = await this.sb.rpc('get_monthly_attendance_by_days', {
        p_user_id: this.form.user_id,
        p_year: this.form.year,
        p_month: this.form.month
      });
      
      console.log('Raw RPC response:', { data, error });

      if (error) {
        console.error('RPC Error:', error);
        throw new Error(error.message || 'حدث خطأ أثناء استرجاع بيانات الحضور');
      }
      
      // Handle the response data
      if (!data) {
        throw new Error('لا توجد بيانات متاحة');
      }
      
      // Try different response formats
      if (Array.isArray(data) && data.length > 0) {
        // Check for nested response format
        if (data[0]?.get_monthly_attendance_by_days) {
          this.reportData = data[0].get_monthly_attendance_by_days;
        } else {
          // Direct array response
          this.reportData = data;
        }
      } else if (typeof data === 'object' && data !== null) {
        // Handle single object response
        this.reportData = [data];
      } else {
        this.reportData = [];
      }
      
      console.log('Processed report data:', this.reportData);
      
      console.log('Processed report data:', this.reportData);
      this.calculateTotals();
      await this.loadSalaryData();
    } catch (e: any) {
      console.error('Error generating report:', e);
      this.error = 'حدث خطأ أثناء تحميل التقرير: ' + (e.message || 'Unknown error');
      this.reportData = [];
    } finally {
      this.loadingReport = false;
      this.loadingSalary = false;
    }
  }

  private calculateTotals() {
    this.totalHours = this.reportData.reduce((sum, day) => {
      return sum + (day.total_hours || 0);
    }, 0);
  }

  getMonthName(monthNumber: number): string {
    return this.months.find(m => m.id === monthNumber)?.name || '';
  }

  formatTime(minutes: number): string {
    if (!minutes) return '00:00';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  formatDateTime(dateTime: string): string {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    return date.toLocaleString('ar-EG', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getRecordType(type: string): string {
    // Check if type is a string and contains 'check_in' or 'check_out'
    if (typeof type === 'string') {
      if (type.toLowerCase().includes('check_in') || type === 'cf73cd53-bec6-4932-aa69-389503eaef54') {
        return 'حضور';
      } else if (type.toLowerCase().includes('check_out') || type === '6a1b3445-1991-45fe-9dee-92cacf71006e') {
        return 'انصراف';
      }
    }
    // Default to 'حضور' for any unknown types
    return 'حضور';
  }

  getDayName(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', { weekday: 'long' });
  }

  isWeekend(dateString: string): boolean {
    const date = new Date(dateString);
    const day = date.getDay();
    return day === 5 || day === 6; // Friday or Saturday
  }

  private async loadSalaryData() {
    if (!this.form.user_id) return;

    this.loadingSalary = true;
    this.salaryError = '';
    
    try {
      console.log('Loading salary data for:', {
        p_user_id: this.form.user_id,
        p_year: this.form.year,
        p_month: this.form.month
      });
      
      const { data, error } = await this.sb.rpc('calculate_monthly_salary', {
        p_user_id: this.form.user_id,
        p_year: this.form.year,
        p_month: this.form.month
      });

      console.log('Salary data response:', { data, error });

      if (error) throw error;
      
      // Handle the direct object response format
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        this.salaryData = data;
      } 
      // Handle the array response format
      else if (Array.isArray(data) && data.length > 0) {
        this.salaryData = data[0]?.calculate_monthly_salary || data[0] || null;
      }
      
      if (!this.salaryData) {
        console.warn('No salary data found in response:', data);
        throw new Error('لا توجد بيانات مرتب متاحة');
      }
      
      console.log('Processed salary data:', this.salaryData);
    } catch (e: any) {
      console.error('Error loading salary data:', e);
      this.salaryError = 'حدث خطأ أثناء حساب الراتب: ' + (e.message || 'Unknown error');
    } finally {
      this.loadingSalary = false;
    }
  }
}
