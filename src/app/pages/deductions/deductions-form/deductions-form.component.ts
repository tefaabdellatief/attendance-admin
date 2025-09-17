import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../../core/supabase.service';
import { SpinnerComponent } from '../../../core/ui/components/spinner/spinner.component';
import { ButtonComponent } from '../../../core/ui/components/button/button.component';
import { CardComponent } from '../../../core/ui/components/card/card.component';

@Component({
  selector: 'app-deductions-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SpinnerComponent, ButtonComponent, CardComponent],
  template: `
    <div class="page-header">
      <div class="header-content">
        <h1>{{ deductionId ? 'تعديل الخصم' : 'إضافة خصم جديد' }}</h1>
        <p class="page-subtitle">{{ deductionId ? 'تعديل بيانات الخصم المحدد' : 'إضافة خصم جديد للموظف' }}</p>
      </div>
      <app-button 
        variant="outline" 
        (btnClick)="goBack()"
        [disabled]="saving">
        ← رجوع للقائمة
      </app-button>
    </div>

    <!-- Loading State -->
    <app-spinner *ngIf="loading" [overlay]="false" message="جاري تحميل بيانات الخصم..."></app-spinner>

    <!-- Error State -->
    <div *ngIf="error && !loading" class="error-message">
      <span>⚠️</span>
      <p>{{ error }}</p>
      <app-button variant="outline" size="sm" (btnClick)="loadDeduction()">إعادة المحاولة</app-button>
    </div>

    <!-- Form -->
    <div *ngIf="!loading && !error">
      <app-card [title]="'بيانات الخصم'" [subtitle]="deductionId ? 'تعديل بيانات الخصم' : 'إدخال بيانات الخصم الجديد'">
        <form (ngSubmit)="onSubmit()" #deductionForm="ngForm" class="deduction-form">
          <div class="form-section">
            <h4>المعلومات الأساسية</h4>
            <div class="form-grid">
              <div class="form-group">
                <label for="user_id">المستخدم <span class="required">*</span></label>
                <select 
                  id="user_id" 
                  name="user_id" 
                  [(ngModel)]="deduction.user_id" 
                  required 
                  class="form-control"
                  [class.is-invalid]="submitted && deductionForm.controls['user_id'].errors">
                  <option [ngValue]="null" disabled>اختر مستخدمًا</option>
                  <option *ngFor="let user of users" [ngValue]="user.id">
                    {{ user.full_name || user.username }}
                  </option>
                </select>
                <div class="invalid-feedback" *ngIf="submitted && deductionForm.controls['user_id']?.errors">
                  يرجى اختيار المستخدم
                </div>
              </div>

              <div class="form-group">
                <label for="amount">المبلغ (جنيه) <span class="required">*</span></label>
                <input 
                  type="number" 
                  id="amount" 
                  name="amount" 
                  [(ngModel)]="deduction.amount" 
                  required 
                  min="0.01"
                  step="0.01"
                  class="form-control"
                  placeholder="أدخل المبلغ"
                  [class.is-invalid]="submitted && deductionForm.controls['amount'].errors">
                <div class="invalid-feedback" *ngIf="submitted && deductionForm.controls['amount']?.errors">
                  يرجى إدخال مبلغ صحيح أكبر من صفر
                </div>
                <small class="form-hint">المبلغ بالجنيه المصري</small>
              </div>

              <div class="form-group full-width">
                <label for="reason">سبب الخصم <span class="required">*</span></label>
                <textarea 
                  id="reason" 
                  name="reason" 
                  [(ngModel)]="deduction.reason" 
                  required 
                  class="form-control"
                  rows="3"
                  placeholder="أدخل سبب الخصم"
                  [class.is-invalid]="submitted && deductionForm.controls['reason'].errors">
                </textarea>
                <div class="invalid-feedback" *ngIf="submitted && deductionForm.controls['reason']?.errors">
                  يرجى إدخال سبب الخصم
                </div>
                <small class="form-hint">وصف مفصل لسبب الخصم</small>
              </div>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <app-button 
              type="submit" 
              variant="primary" 
              [loading]="saving"
              [disabled]="!deductionForm.form.valid || saving">
              {{ deductionId ? 'حفظ التغييرات' : 'إضافة الخصم' }}
            </app-button>
            <app-button 
              type="button" 
              variant="outline" 
              (btnClick)="goBack()"
              [disabled]="saving">
              إلغاء
            </app-button>
          </div>

          <!-- Form Error -->
          <div *ngIf="formError" class="form-error">
            <span>⚠️</span>
            <p>{{ formError }}</p>
          </div>
        </form>
      </app-card>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
      gap: 1rem;
    }

    .header-content h1 {
      margin: 0 0 0.5rem 0;
      color: var(--color-primary-dark);
      font-size: 1.8rem;
    }

    .page-subtitle {
      margin: 0;
      color: var(--muted-text);
      font-size: 1rem;
    }

    .deduction-form {
      max-width: 800px;
      margin: 0 auto;
    }

    .form-section {
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 1.5rem;
      background: #fafafa;
      margin-bottom: 2rem;
    }

    .form-section h4 {
      margin: 0 0 1rem 0;
      color: var(--color-primary-dark);
      font-size: 1.1rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.5rem;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group:last-child {
      margin-bottom: 0;
    }

    .form-group.full-width {
      grid-column: 1 / -1;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: var(--text-color);
    }

    .required {
      color: #dc3545;
    }

    .form-control {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      font-size: 1rem;
      line-height: 1.5;
      background: white;
      transition: all 0.2s ease;
    }

    .form-control:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 2px rgba(246, 184, 25, 0.2);
    }

    .form-control.is-invalid {
      border-color: #dc3545;
      box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.2);
    }

    .invalid-feedback {
      width: 100%;
      margin-top: 0.25rem;
      font-size: 0.875em;
      color: #dc3545;
    }

    .form-hint {
      display: block;
      margin-top: 0.25rem;
      font-size: 0.8rem;
      color: var(--muted-text);
    }

    textarea.form-control {
      min-height: 100px;
      resize: vertical;
      line-height: 1.5;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
    }

    .error-message {
      background: #fee;
      border: 1px solid #fcc;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .error-message span {
      font-size: 1.2rem;
    }

    .error-message p {
      margin: 0;
      color: #c62828;
      flex: 1;
    }

    .form-error {
      background: #fee;
      border: 1px solid #fcc;
      border-radius: 6px;
      padding: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #c62828;
      margin-top: 1rem;
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: stretch;
      }

      .form-section {
        padding: 1rem;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }

      .form-actions {
        flex-direction: column;
      }
    }
  `]
})
export class DeductionsFormComponent implements OnInit {
  deduction: any = {
    user_id: null,
    amount: null,
    reason: ''
  };
  users: any[] = [];
  deductionId: string | null = null;
  loading = false;
  saving = false;
  submitted = false;
  error = '';
  formError = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sb: SupabaseService
  ) {}

  async ngOnInit() {
    this.deductionId = this.route.snapshot.paramMap.get('id');
    await this.loadUsers();
    if (this.deductionId) {
      await this.loadDeduction();
    }
  }

  async loadUsers() {
    try {
      const { data } = await this.sb.rpc('users_get');
      this.users = data || [];
    } catch (error) {
      console.error('Error loading users:', error);
      this.users = [];
    }
  }

  async loadDeduction() {
    if (!this.deductionId) return;
    
    try {
      this.loading = true;
      this.error = '';
      const { data, error } = await this.sb.rpc('deductions_get_by_id', { _id: this.deductionId });
      
      if (error) throw error;
      
      this.deduction = {
        user_id: data.user_id,
        amount: data.amount,
        reason: data.reason || ''
      };
    } catch (error: any) {
      console.error('Error loading deduction:', error);
      this.error = 'حدث خطأ أثناء تحميل بيانات الخصم';
    } finally {
      this.loading = false;
    }
  }

  async onSubmit() {
    this.submitted = true;
    this.formError = '';
    
    if (!this.deduction.user_id || !this.deduction.amount || !this.deduction.reason?.trim()) {
      this.formError = 'يرجى ملء جميع الحقول المطلوبة';
      return;
    }

    if (this.deduction.amount <= 0) {
      this.formError = 'المبلغ يجب أن يكون أكبر من صفر';
      return;
    }

    try {
      this.saving = true;
      
      const currentUser = this.sb.getCurrentUser();
      if (!currentUser?.id) {
        this.formError = 'لا يوجد مستخدم مسجل دخولًا لإنشاء الخصم';
        return;
      }

      const deductionData: any = {
        user_id: this.deduction.user_id,
        amount: parseFloat(this.deduction.amount),
        reason: this.deduction.reason.trim()
      };
      
      if (this.deductionId) {
        const { error } = await this.sb.rpc('deductions_update', {
          _id: this.deductionId,
          _amount: deductionData.amount,
          _reason: deductionData.reason
        });
        if (error) throw error;
      } else {
        const { error } = await this.sb.rpc('deductions_insert', {
          _user_id: deductionData.user_id,
          _amount: deductionData.amount,
          _reason: deductionData.reason,
          _created_by: currentUser.id
        });
        if (error) throw error;
      }
      
      this.router.navigate(['/deductions']);
    } catch (error: any) {
      console.error('Error saving deduction:', error);
      this.formError = this.deductionId 
        ? 'حدث خطأ أثناء تحديث الخصم' 
        : 'حدث خطأ أثناء إضافة الخصم';
    } finally {
      this.saving = false;
    }
  }

  goBack() {
    this.router.navigate(['/deductions']);
  }
}
