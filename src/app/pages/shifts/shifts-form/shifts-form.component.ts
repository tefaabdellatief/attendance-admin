import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../../core/supabase.service';
import { SpinnerComponent } from '../../../core/ui/components/spinner/spinner.component';
import { ButtonComponent } from '../../../core/ui/components/button/button.component';
import { CardComponent } from '../../../core/ui/components/card/card.component';

@Component({
  selector: 'app-shifts-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SpinnerComponent, ButtonComponent, CardComponent],
  template: `
    <div class="page-header">
      <div class="header-content">
        <h1>{{ shiftId ? 'تعديل الوردية' : 'إضافة وردية جديدة' }}</h1>
        <p class="page-subtitle">{{ shiftId ? 'تعديل بيانات الوردية المحددة' : 'إضافة وردية عمل جديدة للنظام' }}</p>
      </div>
      <app-button 
        variant="outline" 
        (btnClick)="goBack()"
        [disabled]="saving">
        ← رجوع للقائمة
      </app-button>
    </div>

    <!-- Loading State -->
    <app-spinner *ngIf="loading" [overlay]="false" message="جاري تحميل بيانات الوردية..."></app-spinner>

    <!-- Error State -->
    <div *ngIf="error && !loading" class="error-message">
      <span>⚠️</span>
      <p>{{ error }}</p>
      <app-button variant="outline" size="sm" (btnClick)="loadShift()">إعادة المحاولة</app-button>
    </div>

    <!-- Form -->
    <div *ngIf="!loading && !error">
      <app-card [title]="'بيانات الوردية'" [subtitle]="shiftId ? 'تعديل بيانات الوردية' : 'إدخال بيانات الوردية الجديدة'">
        <form (ngSubmit)="onSubmit()" #shiftForm="ngForm" class="shift-form">
          <div class="form-section">
            <h4>المعلومات الأساسية</h4>
            <div class="form-grid">
              <div class="form-group">
                <label for="name">اسم الوردية <span class="required">*</span></label>
                <input 
                  type="text" 
                  id="name" 
                  name="name" 
                  [(ngModel)]="shift.name" 
                  required 
                  class="form-control"
                  placeholder="أدخل اسم الوردية"
                  [class.is-invalid]="submitted && shiftForm.controls['name'].errors">
                <div class="invalid-feedback" *ngIf="submitted && shiftForm.controls['name']?.errors">
                  اسم الوردية مطلوب
                </div>
              </div>

              <div class="form-group">
                <label for="start_time">وقت البداية <span class="required">*</span></label>
                <input 
                  type="time" 
                  id="start_time" 
                  name="start_time" 
                  [(ngModel)]="shift.start_time" 
                  required
                  class="form-control"
                  [class.is-invalid]="submitted && shiftForm.controls['start_time'].errors">
                <div class="invalid-feedback" *ngIf="submitted && shiftForm.controls['start_time']?.errors">
                  وقت البداية مطلوب
                </div>
                <small class="form-hint">تنسيق 24 ساعة (HH:MM)</small>
              </div>

              <div class="form-group">
                <label for="duration_hours">عدد الساعات <span class="required">*</span></label>
                <input 
                  type="number" 
                  id="duration_hours" 
                  name="duration_hours" 
                  [(ngModel)]="shift.duration_hours" 
                  required
                  min="1"
                  step="1"
                  class="form-control"
                  placeholder="8"
                  [class.is-invalid]="submitted && shiftForm.controls['duration_hours'].errors">
                <div class="invalid-feedback" *ngIf="submitted && shiftForm.controls['duration_hours']?.errors">
                  عدد الساعات مطلوب ويجب أن يكون أكبر من 0
                </div>
                <small class="form-hint">عدد ساعات العمل في الوردية</small>
              </div>

              <div class="form-group">
                <label for="checkin_grace_minutes">سماح تأخير الدخول (دقيقة)</label>
                <input 
                  type="number" 
                  id="checkin_grace_minutes" 
                  name="checkin_grace_minutes" 
                  [(ngModel)]="shift.checkin_grace_minutes" 
                  min="0"
                  step="1"
                  class="form-control"
                  placeholder="0">
                <small class="form-hint">عدد الدقائق المسموح بها للتأخير في الدخول</small>
              </div>

              <div class="form-group">
                <label for="checkout_grace_minutes">سماح تأخير الخروج (دقيقة)</label>
                <input 
                  type="number" 
                  id="checkout_grace_minutes" 
                  name="checkout_grace_minutes" 
                  [(ngModel)]="shift.checkout_grace_minutes" 
                  min="0"
                  step="1"
                  class="form-control"
                  placeholder="0">
                <small class="form-hint">عدد الدقائق المسموح بها للتأخير في الخروج</small>
              </div>
            </div>
          </div>

          <!-- Preview Section -->
          <div class="form-section" *ngIf="shift.start_time && shift.duration_hours">
            <h4>معاينة الوردية</h4>
            <div class="preview-container">
              <div class="preview-item">
                <label>وقت البداية:</label>
                <span class="time-badge">{{ shift.start_time }}</span>
              </div>
              <div class="preview-item">
                <label>وقت النهاية:</label>
                <span class="time-badge">{{ computeEndTime(shift.start_time, shift.duration_hours) }}</span>
              </div>
              <div class="preview-item">
                <label>مدة العمل:</label>
                <span class="duration-text">{{ shift.duration_hours }} ساعة</span>
              </div>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <app-button 
              type="submit" 
              variant="primary" 
              [loading]="saving"
              [disabled]="!shiftForm.form.valid || saving">
              {{ shiftId ? 'حفظ التغييرات' : 'إضافة الوردية' }}
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

    .shift-form {
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
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }

    .form-group {
      margin-bottom: 1rem;
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

    .preview-container {
      background: white;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 1rem;
    }

    .preview-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px dashed var(--border-color);
    }

    .preview-item:last-child {
      border-bottom: none;
    }

    .preview-item label {
      margin: 0;
      font-weight: 600;
      color: var(--text-color);
    }

    .time-badge {
      display: inline-block;
      background: var(--color-primary);
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.9rem;
      font-weight: 600;
      font-family: monospace;
    }

    .duration-text {
      font-weight: 600;
      color: var(--color-primary-dark);
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
export class ShiftsFormComponent implements OnInit {
  shift: any = {
    name: '',
    start_time: '',
    duration_hours: 8,
    checkin_grace_minutes: 0,
    checkout_grace_minutes: 0
  };
  shiftId: string | null = null;
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
    this.shiftId = this.route.snapshot.paramMap.get('id');
    if (this.shiftId) {
      this.loadShift();
    }
  }

  async loadShift() {
    if (!this.shiftId) return;
    
    try {
      this.loading = true;
      this.error = '';
      const { data, error } = await this.sb.rpc('shifts_get_by_id', { _id: this.shiftId });
      
      if (error) throw error;
      
      this.shift = {
        name: data.name || '',
        start_time: this.convertTimeToHHMM(data.start_time || ''),
        duration_hours: data.duration_hours || 8,
        checkin_grace_minutes: data.checkin_grace_minutes || 0,
        checkout_grace_minutes: data.checkout_grace_minutes || 0
      };
    } catch (error: any) {
      console.error('Error loading shift:', error);
      this.error = 'حدث خطأ أثناء تحميل بيانات الوردية';
    } finally {
      this.loading = false;
    }
  }

  async onSubmit() {
    this.submitted = true;
    this.formError = '';
    
    if (!this.shift.name || !this.shift.start_time || !this.shift.duration_hours) {
      this.formError = 'يرجى ملء جميع الحقول المطلوبة';
      return;
    }

    if (!this.isValidTime(this.shift.start_time)) {
      this.formError = 'صيغة وقت البداية غير صحيحة (HH:mm)';
      return;
    }

    const duration = parseInt(this.shift.duration_hours, 10);
    if (!Number.isInteger(duration) || duration < 1) {
      this.formError = 'عدد الساعات يجب أن يكون عددًا صحيحًا موجبًا';
      return;
    }

    const checkinGrace = parseInt(this.shift.checkin_grace_minutes, 10) || 0;
    const checkoutGrace = parseInt(this.shift.checkout_grace_minutes, 10) || 0;
    if (checkinGrace < 0 || checkoutGrace < 0) {
      this.formError = 'قيم السماح يجب أن تكون أعدادًا صحيحة صفرية أو موجبة';
      return;
    }

    try {
      this.saving = true;
      
      // Use start_time in HH:mm format for PostgreSQL time type
      const startTime = this.shift.start_time;
      
      if (this.shiftId) {
        const { error } = await this.sb.rpc('shifts_update', {
          _id: this.shiftId,
          _name: this.shift.name.trim(),
          _start_time: startTime,
          _duration_hours: duration,
          _checkin_grace_minutes: checkinGrace,
          _checkout_grace_minutes: checkoutGrace
        });
        if (error) throw error;
      } else {
        const { error } = await this.sb.rpc('shifts_insert', {
          _name: this.shift.name.trim(),
          _start_time: startTime,
          _duration_hours: duration,
          _checkin_grace_minutes: checkinGrace,
          _checkout_grace_minutes: checkoutGrace
        });
        if (error) throw error;
      }
      
      this.router.navigate(['/shifts']);
    } catch (error: any) {
      console.error('Error saving shift:', error);
      this.formError = this.shiftId 
        ? 'حدث خطأ أثناء تحديث الوردية' 
        : 'حدث خطأ أثناء إضافة الوردية';
    } finally {
      this.saving = false;
    }
  }

  goBack() {
    this.router.navigate(['/shifts']);
  }

  private isValidTime(t: string): boolean {
    // Accept HH:mm 24-hour format
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(t));
  }

  private convertTimeToInterval(time: string): string {
    // Convert HH:mm format to PostgreSQL interval format
    // e.g., "08:30" -> "08:30:00"
    if (!time || !this.isValidTime(time)) {
      return '00:00:00';
    }
    return time + ':00';
  }

  private convertTimeToHHMM(timeValue: string): string {
    // Convert PostgreSQL time format to HH:mm format for HTML input
    // e.g., "08:30:00" -> "08:30"
    if (!timeValue) return '';
    
    // Handle both "HH:mm:ss" and "HH:mm" formats
    const parts = timeValue.split(':');
    if (parts.length >= 2) {
      const hours = parts[0].padStart(2, '0');
      const minutes = parts[1].padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    
    return timeValue; // Return as-is if format is unexpected
  }

  // Compute end time from start_time (HH:mm) and duration in hours, wrap past midnight
  computeEndTime(start: string, durationHours: number): string {
    if (!start || durationHours == null) return '-';
    const [hhStr, mmStr] = String(start).split(':');
    const hh = Number(hhStr);
    const mm = Number(mmStr);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return '-';
    const startMinutes = hh * 60 + mm;
    const addMinutes = Math.round(Number(durationHours) * 60);
    const endMinutes = (startMinutes + addMinutes) % (24 * 60);
    const endH = Math.floor(endMinutes / 60);
    const endM = endMinutes % 60;
    const pad = (n: number) => (n < 10 ? '0' + n : String(n));
    return `${pad(endH)}:${pad(endM)}`;
  }
}
