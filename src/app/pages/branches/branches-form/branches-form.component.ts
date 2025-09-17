import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../../core/supabase.service';
import { SpinnerComponent } from '../../../core/ui/components/spinner/spinner.component';
import { ButtonComponent } from '../../../core/ui/components/button/button.component';
import { CardComponent } from '../../../core/ui/components/card/card.component';

@Component({
  selector: 'app-branches-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SpinnerComponent, ButtonComponent, CardComponent],
  template: `
    <div class="page-header">
      <div class="header-content">
        <h1>{{ branchId ? 'تعديل الفرع' : 'إضافة فرع جديد' }}</h1>
        <p class="page-subtitle">{{ branchId ? 'تعديل بيانات الفرع المحدد' : 'إضافة فرع عمل جديد للنظام' }}</p>
      </div>
      <app-button 
        variant="outline" 
        (btnClick)="goBack()"
        [disabled]="saving">
        ← رجوع للقائمة
      </app-button>
    </div>

    <!-- Loading State -->
    <app-spinner *ngIf="loading" [overlay]="false" message="جاري تحميل بيانات الفرع..."></app-spinner>

    <!-- Error State -->
    <div *ngIf="error && !loading" class="error-message">
      <span>⚠️</span>
      <p>{{ error }}</p>
      <app-button variant="outline" size="sm" (btnClick)="loadBranch()">إعادة المحاولة</app-button>
    </div>

    <!-- Form -->
    <div *ngIf="!loading && !error">
      <app-card [title]="'بيانات الفرع'" [subtitle]="branchId ? 'تعديل بيانات الفرع' : 'إدخال بيانات الفرع الجديد'">
        <form (ngSubmit)="onSubmit()" #branchForm="ngForm" class="branch-form">
          <div class="form-section">
            <h4>المعلومات الأساسية</h4>
            <div class="form-grid">
              <div class="form-group">
                <label for="name">اسم الفرع <span class="required">*</span></label>
                <input 
                  type="text" 
                  id="name" 
                  name="name" 
                  [(ngModel)]="branch.name" 
                  required 
                  class="form-control"
                  placeholder="أدخل اسم الفرع"
                  [class.is-invalid]="submitted && branchForm.controls['name'].errors">
                <div class="invalid-feedback" *ngIf="submitted && branchForm.controls['name']?.errors">
                  اسم الفرع مطلوب
                </div>
              </div>

              <div class="form-group full-width">
                <label for="address">العنوان</label>
                <textarea 
                  id="address" 
                  name="address" 
                  [(ngModel)]="branch.address" 
                  class="form-control"
                  rows="3"
                  placeholder="أدخل عنوان الفرع (اختياري)">
                </textarea>
                <small class="form-hint">العنوان الكامل للفرع</small>
              </div>
            </div>
          </div>

          <div class="form-section">
            <h4>الموقع الجغرافي</h4>
            <div class="form-grid">
              <div class="form-group">
                <label for="latitude">خط العرض</label>
                <input 
                  type="number" 
                  id="latitude" 
                  name="latitude" 
                  [(ngModel)]="branch.latitude" 
                  step="any"
                  class="form-control"
                  placeholder="31.2001"
                  [class.is-invalid]="submitted && branchForm.controls['latitude'].errors">
                <div class="invalid-feedback" *ngIf="submitted && branchForm.controls['latitude']?.errors">
                  خط العرض غير صحيح
                </div>
                <small class="form-hint">خط العرض (Latitude) - مثال: 31.2001</small>
              </div>

              <div class="form-group">
                <label for="longitude">خط الطول</label>
                <input 
                  type="number" 
                  id="longitude" 
                  name="longitude" 
                  [(ngModel)]="branch.longitude" 
                  step="any"
                  class="form-control"
                  placeholder="29.9187"
                  [class.is-invalid]="submitted && branchForm.controls['longitude'].errors">
                <div class="invalid-feedback" *ngIf="submitted && branchForm.controls['longitude']?.errors">
                  خط الطول غير صحيح
                </div>
                <small class="form-hint">خط الطول (Longitude) - مثال: 29.9187</small>
              </div>
            </div>
          </div>

          <!-- Preview Section -->
          <div class="form-section" *ngIf="branch.latitude && branch.longitude">
            <h4>معاينة الموقع</h4>
            <div class="preview-container">
              <div class="preview-item">
                <label>خط العرض:</label>
                <span class="coordinate-badge">{{ branch.latitude }}</span>
              </div>
              <div class="preview-item">
                <label>خط الطول:</label>
                <span class="coordinate-badge">{{ branch.longitude }}</span>
              </div>
              <div class="preview-item">
                <label>رابط الخريطة:</label>
                <a [href]="getMapUrl()" target="_blank" class="map-link">
                  عرض على الخريطة
                </a>
              </div>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <app-button 
              type="submit" 
              variant="primary" 
              [loading]="saving"
              [disabled]="!branchForm.form.valid || saving">
              {{ branchId ? 'حفظ التغييرات' : 'إضافة الفرع' }}
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

    .branch-form {
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

    .coordinate-badge {
      display: inline-block;
      background: #f8f9fa;
      color: var(--text-color);
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.9rem;
      font-weight: 500;
      font-family: monospace;
      border: 1px solid var(--border-color);
    }

    .map-link {
      color: var(--color-primary);
      text-decoration: none;
      font-weight: 500;
    }

    .map-link:hover {
      text-decoration: underline;
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
export class BranchesFormComponent implements OnInit {
  branch: any = {
    name: '',
    address: '',
    latitude: null,
    longitude: null
  };
  branchId: string | null = null;
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
    this.branchId = this.route.snapshot.paramMap.get('id');
    if (this.branchId) {
      this.loadBranch();
    }
  }

  async loadBranch() {
    if (!this.branchId) return;
    
    try {
      this.loading = true;
      this.error = '';
      const { data, error } = await this.sb.rpc('branches_get_by_id', { _id: this.branchId });
      
      if (error) throw error;
      
      this.branch = {
        name: data.name || '',
        address: data.address || '',
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null
      };
    } catch (error: any) {
      console.error('Error loading branch:', error);
      this.error = 'حدث خطأ أثناء تحميل بيانات الفرع';
    } finally {
      this.loading = false;
    }
  }

  async onSubmit() {
    this.submitted = true;
    this.formError = '';
    
    if (!this.branch.name) {
      this.formError = 'يرجى إدخال اسم الفرع';
      return;
    }

    // Validate coordinates if provided
    if (this.branch.latitude !== null && this.branch.latitude !== '') {
      const lat = parseFloat(this.branch.latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        this.formError = 'خط العرض يجب أن يكون رقمًا بين -90 و 90';
        return;
      }
    }

    if (this.branch.longitude !== null && this.branch.longitude !== '') {
      const lng = parseFloat(this.branch.longitude);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        this.formError = 'خط الطول يجب أن يكون رقمًا بين -180 و 180';
        return;
      }
    }

    try {
      this.saving = true;
      
      const branchData = {
        name: this.branch.name.trim(),
        address: this.branch.address?.trim() || null,
        latitude: this.branch.latitude !== null && this.branch.latitude !== '' ? parseFloat(this.branch.latitude) : null,
        longitude: this.branch.longitude !== null && this.branch.longitude !== '' ? parseFloat(this.branch.longitude) : null
      };
      
      if (this.branchId) {
        const { error } = await this.sb.rpc('branches_update', {
          _id: this.branchId,
          _name: branchData.name,
          _address: branchData.address,
          _latitude: branchData.latitude,
          _longitude: branchData.longitude
        });
        if (error) throw error;
      } else {
        const { error } = await this.sb.rpc('branches_insert', {
          _name: branchData.name,
          _address: branchData.address,
          _latitude: branchData.latitude,
          _longitude: branchData.longitude
        });
        if (error) throw error;
      }
      
      this.router.navigate(['/branches']);
    } catch (error: any) {
      console.error('Error saving branch:', error);
      this.formError = this.branchId 
        ? 'حدث خطأ أثناء تحديث الفرع' 
        : 'حدث خطأ أثناء إضافة الفرع';
    } finally {
      this.saving = false;
    }
  }

  goBack() {
    this.router.navigate(['/branches']);
  }

  getMapUrl(): string {
    if (this.branch.latitude && this.branch.longitude) {
      return `https://www.google.com/maps?q=${this.branch.latitude},${this.branch.longitude}`;
    }
    return '#';
  }
}
