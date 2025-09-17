import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RequestStatus, RequestStatusService } from '../../../core/services/request-status.service';
import { SpinnerComponent } from '../../../core/ui/components/spinner/spinner.component';
import { ButtonComponent } from '../../../core/ui/components/button/button.component';
import { CardComponent } from '../../../core/ui/components/card/card.component';

@Component({
  selector: 'app-request-status-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SpinnerComponent, ButtonComponent, CardComponent],
  template: `
    <div class="page-header">
      <div class="header-content">
        <h1>{{ statusId ? 'تعديل الحالة' : 'إضافة حالة جديدة' }}</h1>
        <p class="page-subtitle">{{ statusId ? 'تعديل بيانات الحالة المحددة' : 'إضافة حالة طلب جديدة للنظام' }}</p>
      </div>
      <app-button 
        variant="outline" 
        (btnClick)="goBack()"
        [disabled]="saving">
        ← رجوع للقائمة
      </app-button>
    </div>

    <!-- Loading State -->
    <app-spinner *ngIf="loading" [overlay]="false" message="جاري تحميل بيانات الحالة..."></app-spinner>

    <!-- Error State -->
    <div *ngIf="error && !loading" class="error-message">
      <span>⚠️</span>
      <p>{{ error }}</p>
      <app-button variant="outline" size="sm" (btnClick)="loadStatus()">إعادة المحاولة</app-button>
    </div>

    <!-- Form -->
    <div *ngIf="!loading && !error">
      <app-card [title]="'بيانات الحالة'" [subtitle]="statusId ? 'تعديل بيانات الحالة' : 'إدخال بيانات الحالة الجديدة'">
        <form (ngSubmit)="onSubmit()" #statusForm="ngForm" class="status-form">
          <div class="form-section">
            <h4>المعلومات الأساسية</h4>
            <div class="form-group">
              <label for="code">الكود <span class="required">*</span></label>
              <input 
                type="text" 
                id="code" 
                name="code" 
                [(ngModel)]="status.code" 
                required 
                [readonly]="!!statusId"
                class="form-control"
                placeholder="أدخل كود الحالة"
                [class.is-invalid]="submitted && statusForm.controls['code'].errors">
              <div class="invalid-feedback" *ngIf="submitted && statusForm.controls['code']?.errors">
                الكود مطلوب
              </div>
              <small class="form-hint">كود فريد للحالة (لا يمكن تغييره بعد الإنشاء)</small>
            </div>

            <div class="form-group">
              <label for="name_ar">الاسم بالعربي <span class="required">*</span></label>
              <input 
                type="text" 
                id="name_ar" 
                name="name_ar" 
                [(ngModel)]="status.name_ar" 
                required
                class="form-control"
                placeholder="أدخل اسم الحالة بالعربية"
                [class.is-invalid]="submitted && statusForm.controls['name_ar'].errors">
              <div class="invalid-feedback" *ngIf="submitted && statusForm.controls['name_ar']?.errors">
                الاسم بالعربي مطلوب
              </div>
            </div>
          </div>


          <!-- Form Actions -->
          <div class="form-actions">
            <app-button 
              type="submit" 
              variant="primary" 
              [loading]="saving"
              [disabled]="!statusForm.form.valid || saving">
              {{ statusId ? 'حفظ التغييرات' : 'إضافة الحالة' }}
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

    .status-form {
      max-width: 800px;
      margin: 0 auto;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .form-section {
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 1.5rem;
      background: #fafafa;
    }

    .form-section h4 {
      margin: 0 0 1rem 0;
      color: var(--color-primary-dark);
      font-size: 1.1rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.5rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group:last-child {
      margin-bottom: 0;
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

    .color-input-group {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .color-picker {
      width: 50px;
      height: 40px;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      cursor: pointer;
    }

    .color-text {
      flex: 1;
      font-family: monospace;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      font-weight: 500;
    }

    .checkbox-label input[type="checkbox"] {
      width: 18px;
      height: 18px;
      accent-color: var(--color-primary);
    }

    .preview-container {
      background: white;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 1rem;
    }

    .preview-item {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .preview-item label {
      margin: 0;
      font-weight: 600;
      color: var(--text-color);
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

      .form-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .form-section {
        padding: 1rem;
      }

      .form-actions {
        flex-direction: column;
      }

      .preview-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }
    }
  `]
})
export class RequestStatusFormComponent implements OnInit {
  status: RequestStatus = {
    code: '',
    name_ar: ''
  };
  statusId: string | null = null;
  loading = false;
  saving = false;
  submitted = false;
  error = '';
  formError = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private requestStatusService: RequestStatusService
  ) {}

  ngOnInit() {
    this.statusId = this.route.snapshot.paramMap.get('id');
    if (this.statusId) {
      this.loadStatus();
    }
  }

  async loadStatus() {
    if (!this.statusId) return;
    
    try {
      this.loading = true;
      this.error = '';
      this.status = await this.requestStatusService.getById(this.statusId);
    } catch (error: any) {
      console.error('Error loading status:', error);
      this.error = 'حدث خطأ أثناء تحميل بيانات الحالة';
    } finally {
      this.loading = false;
    }
  }

  async onSubmit() {
    this.submitted = true;
    this.formError = '';
    
    if (!this.status.code || !this.status.name_ar) {
      this.formError = 'يرجى ملء جميع الحقول المطلوبة';
      return;
    }

    try {
      this.saving = true;
      
      const statusData: RequestStatus = {
        code: this.status.code,
        name_ar: this.status.name_ar
      };
      
      if (this.statusId) {
        await this.requestStatusService.update(this.statusId, statusData);
      } else {
        await this.requestStatusService.create(statusData);
      }
      
      this.router.navigate(['/request-statuses']);
    } catch (error: any) {
      console.error('Error saving status:', error);
      this.formError = this.statusId 
        ? 'حدث خطأ أثناء تحديث الحالة' 
        : 'حدث خطأ أثناء إضافة الحالة';
    } finally {
      this.saving = false;
    }
  }

  goBack() {
    this.router.navigate(['/request-statuses']);
  }

}
