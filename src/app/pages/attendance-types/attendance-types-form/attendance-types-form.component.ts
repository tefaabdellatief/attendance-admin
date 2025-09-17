import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../../core/supabase.service';
import { SpinnerComponent } from '../../../core/ui/components/spinner/spinner.component';
import { ButtonComponent } from '../../../core/ui/components/button/button.component';
import { CardComponent } from '../../../core/ui/components/card/card.component';

@Component({
  selector: 'app-attendance-types-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SpinnerComponent, ButtonComponent, CardComponent],
  template: `
    <div class="page-header">
      <div class="header-content">
        <h1>{{ typeId ? 'تعديل نوع الحضور' : 'إضافة نوع حضور جديد' }}</h1>
        <p class="page-subtitle">{{ typeId ? 'تعديل بيانات نوع الحضور المحدد' : 'إضافة نوع حضور جديد للنظام' }}</p>
      </div>
      <app-button 
        variant="outline" 
        (btnClick)="goBack()"
        [disabled]="saving">
        ← رجوع للقائمة
      </app-button>
    </div>

    <!-- Loading State -->
    <app-spinner *ngIf="loading" [overlay]="false" message="جاري تحميل بيانات نوع الحضور..."></app-spinner>

    <!-- Error State -->
    <div *ngIf="error && !loading" class="error-message">
      <span>⚠️</span>
      <p>{{ error }}</p>
      <app-button variant="outline" size="sm" (btnClick)="loadType()">إعادة المحاولة</app-button>
    </div>

    <!-- Form -->
    <div *ngIf="!loading && !error">
      <app-card [title]="'بيانات نوع الحضور'" [subtitle]="typeId ? 'تعديل بيانات نوع الحضور' : 'إدخال بيانات نوع الحضور الجديد'">
        <form (ngSubmit)="onSubmit()" #typeForm="ngForm" class="type-form">
          <div class="form-section">
            <h4>المعلومات الأساسية</h4>
            <div class="form-grid">
              <div class="form-group full-width">
                <label for="name">اسم نوع الحضور <span class="required">*</span></label>
                <input 
                  type="text" 
                  id="name" 
                  name="name" 
                  [(ngModel)]="type.name" 
                  required 
                  class="form-control"
                  placeholder="أدخل اسم نوع الحضور"
                  [class.is-invalid]="submitted && typeForm.controls['name'].errors">
                <div class="invalid-feedback" *ngIf="submitted && typeForm.controls['name']?.errors">
                  اسم نوع الحضور مطلوب
                </div>
                <small class="form-hint">مثال: دخول، انصراف، استراحة، إلخ</small>
              </div>

              <div class="form-group full-width">
                <label for="description">الوصف</label>
                <textarea 
                  id="description" 
                  name="description" 
                  [(ngModel)]="type.description" 
                  class="form-control"
                  rows="3"
                  placeholder="أدخل وصف نوع الحضور (اختياري)">
                </textarea>
                <small class="form-hint">وصف مفصل لنوع الحضور (اختياري)</small>
              </div>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <app-button 
              type="submit" 
              variant="primary" 
              [loading]="saving"
              [disabled]="!typeForm.form.valid || saving">
              {{ typeId ? 'حفظ التغييرات' : 'إضافة نوع الحضور' }}
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

    .type-form {
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
      grid-template-columns: 1fr;
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

      .form-actions {
        flex-direction: column;
      }
    }
  `]
})
export class AttendanceTypesFormComponent implements OnInit {
  type: any = {
    name: '',
    description: ''
  };
  typeId: string | null = null;
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

  ngOnInit() {
    this.typeId = this.route.snapshot.paramMap.get('id');
    if (this.typeId) {
      this.loadType();
    }
  }

  async loadType() {
    if (!this.typeId) return;
    
    try {
      this.loading = true;
      this.error = '';
      const { data, error } = await this.sb.rpc('attendance_types_get_by_id', { _id: this.typeId });
      
      if (error) throw error;
      
      this.type = {
        name: data.name || '',
        description: data.description || ''
      };
    } catch (error: any) {
      console.error('Error loading type:', error);
      this.error = 'حدث خطأ أثناء تحميل بيانات نوع الحضور';
    } finally {
      this.loading = false;
    }
  }

  async onSubmit() {
    this.submitted = true;
    this.formError = '';
    
    if (!this.type.name || !this.type.name.trim()) {
      this.formError = 'يرجى إدخال اسم نوع الحضور';
      return;
    }

    try {
      this.saving = true;
      
      if (this.typeId) {
        const { error } = await this.sb.rpc('attendance_types_update', {
          _id: this.typeId,
          _name: this.type.name.trim(),
          _description: this.type.description?.trim() || null
        });
        if (error) throw error;
      } else {
        const { error } = await this.sb.rpc('attendance_types_insert', {
          _name: this.type.name.trim(),
          _description: this.type.description?.trim() || null
        });
        if (error) throw error;
      }
      
      this.router.navigate(['/attendance-types']);
    } catch (error: any) {
      console.error('Error saving type:', error);
      this.formError = this.typeId 
        ? 'حدث خطأ أثناء تحديث نوع الحضور' 
        : 'حدث خطأ أثناء إضافة نوع الحضور';
    } finally {
      this.saving = false;
    }
  }

  goBack() {
    this.router.navigate(['/attendance-types']);
  }
}
