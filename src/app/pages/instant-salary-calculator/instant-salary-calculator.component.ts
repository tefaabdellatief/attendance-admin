import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/supabase.service';
import { ButtonComponent } from '../../core/ui/components/button/button.component';
import { SpinnerComponent } from '../../core/ui/components/spinner/spinner.component';

@Component({
  selector: 'app-instant-salary-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, SpinnerComponent],
  templateUrl: './instant-salary-calculator.component.html',
  styleUrls: ['./instant-salary-calculator.component.scss']
})
export class InstantSalaryCalculatorComponent implements OnInit {
  loading = false;
  error = '';
  salaryData: any = null;
  
  // Form model
  form = {
    user_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
    base_salary: 10000,
    allowed_off_days: 4,
    shift_hours: 5
  };
  
  users: any[] = [];
  
  constructor(private sb: SupabaseService) {}

  async ngOnInit() {
    await this.loadUsers();
  }
  
  async loadUsers() {
    try {
      this.loading = true;
      const { data, error } = await this.sb.rpc('users_get');
      
      if (error) throw error;
      this.users = data || [];
      
      // Auto-select the first user if available
      if (this.users.length > 0 && !this.form.user_id) {
        this.form.user_id = this.users[0].id;
      }
    } catch (e: any) {
      console.error('Error loading users:', e);
      this.error = 'حدث خطأ أثناء تحميل قائمة الموظفين';
    } finally {
      this.loading = false;
    }
  }
  
  async calculateSalary() {
    if (!this.form.user_id) {
      this.error = 'الرجاء اختيار الموظف';
      return;
    }
    
    this.loading = true;
    this.error = '';
    this.salaryData = null;
    
    try {
      console.log('Calculating instant salary with:', this.form);
      
      const { data, error } = await this.sb.rpc('calculate_instant_salary', {
        p_user_id: this.form.user_id,
        p_start_date: this.form.start_date,
        p_end_date: this.form.end_date,
        p_base_salary: this.form.base_salary,
        p_allowed_off_days: this.form.allowed_off_days,
        p_shift_hours: this.form.shift_hours
      });
      
      console.log('Instant salary response:', { data, error });
      
      if (error) throw error;
      
      // Handle the response format
      if (data && typeof data === 'object') {
        if (Array.isArray(data) && data.length > 0) {
          this.salaryData = data[0]?.calculate_instant_salary || data[0] || null;
        } else if (!Array.isArray(data)) {
          this.salaryData = data;
        }
      }
      
      if (!this.salaryData) {
        throw new Error('لا توجد بيانات متاحة للحساب');
      }
      
      console.log('Processed salary data:', this.salaryData);
    } catch (e: any) {
      console.error('Error calculating salary:', e);
      this.error = 'حدث خطأ أثناء حساب الراتب: ' + (e.message || 'Unknown error');
    } finally {
      this.loading = false;
    }
  }
  
  // Format numbers with 2 decimal places
  formatNumber(value: number): string {
    return value?.toFixed(2) || '0.00';
  }
  
  // Format minutes to hours and minutes
  formatMinutes(minutes: number): string {
    if (!minutes && minutes !== 0) return '0 ساعة';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} ساعة ${mins} دقيقة`;
  }
}
