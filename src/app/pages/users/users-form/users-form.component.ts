import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../../core/supabase.service';
import { SpinnerComponent } from '../../../core/ui/components/spinner/spinner.component';
import { ButtonComponent } from '../../../core/ui/components/button/button.component';
import { CardComponent } from '../../../core/ui/components/card/card.component';

@Component({
  selector: 'app-users-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SpinnerComponent, ButtonComponent, CardComponent],
  template: `
    <div class="page-header">
      <div class="header-content">
        <h1>{{ userId ? 'تعديل المستخدم' : 'إضافة مستخدم جديد' }}</h1>
        <p class="page-subtitle">{{ userId ? 'تعديل بيانات المستخدم المحدد' : 'إضافة مستخدم جديد للنظام' }}</p>
      </div>
      <app-button 
        variant="outline" 
        (btnClick)="goBack()"
        [disabled]="saving">
        ← رجوع للقائمة
      </app-button>
    </div>

    <!-- Loading State -->
    <app-spinner *ngIf="loading" [overlay]="false" message="جاري تحميل بيانات المستخدم..."></app-spinner>

    <!-- Error State -->
    <div *ngIf="error && !loading" class="error-message">
      <span>⚠️</span>
      <p>{{ error }}</p>
      <app-button variant="outline" size="sm" (btnClick)="loadUser()">إعادة المحاولة</app-button>
    </div>

    <!-- Form -->
    <div *ngIf="!loading && !error">
      <app-card [title]="'بيانات المستخدم'" [subtitle]="userId ? 'تعديل بيانات المستخدم' : 'إدخال بيانات المستخدم الجديد'">
        <form (ngSubmit)="onSubmit()" #userForm="ngForm" class="user-form">
          <div class="form-section">
            <h4>المعلومات الشخصية</h4>
            <div class="form-grid">
              <div class="form-group">
                <label for="full_name">الاسم الكامل <span class="required">*</span></label>
                <input 
                  type="text" 
                  id="full_name" 
                  name="full_name" 
                  [(ngModel)]="user.full_name" 
                  required 
                  class="form-control"
                  placeholder="أدخل الاسم الكامل"
                  [class.is-invalid]="submitted && userForm.controls['full_name'].errors">
                <div class="invalid-feedback" *ngIf="submitted && userForm.controls['full_name']?.errors">
                  الاسم الكامل مطلوب
                </div>
              </div>

              <div class="form-group">
                <label for="username">اسم المستخدم <span class="required">*</span></label>
                <input 
                  type="text" 
                  id="username" 
                  name="username" 
                  [(ngModel)]="user.username" 
                  required 
                  class="form-control"
                  placeholder="أدخل اسم المستخدم"
                  [class.is-invalid]="submitted && userForm.controls['username'].errors">
                <div class="invalid-feedback" *ngIf="submitted && userForm.controls['username']?.errors">
                  اسم المستخدم مطلوب
                </div>
              </div>

              <div class="form-group">
                <label for="national_number">الرقم القومي</label>
                <input 
                  type="text" 
                  id="national_number" 
                  name="national_number" 
                  [(ngModel)]="user.national_number" 
                  class="form-control"
                  placeholder="أدخل الرقم القومي">
              </div>

              <div class="form-group">
                <label for="email">البريد الإلكتروني</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  [(ngModel)]="user.email" 
                  class="form-control"
                  placeholder="أدخل البريد الإلكتروني">
              </div>

              <div class="form-group">
                <label for="phone">رقم الهاتف</label>
                <input 
                  type="tel" 
                  id="phone" 
                  name="phone" 
                  [(ngModel)]="user.phone" 
                  class="form-control"
                  placeholder="أدخل رقم الهاتف">
              </div>

              <div class="form-group">
                <label for="shift_id">الوردية</label>
                <select 
                  id="shift_id" 
                  name="shift_id" 
                  [(ngModel)]="user.shift_id" 
                  class="form-control">
                  <option [ngValue]="null">اختر الوردية</option>
                  <option *ngFor="let shift of shifts" [ngValue]="shift.id">
                    {{ shift.name }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label for="base_salary">الراتب الأساسي</label>
                <input 
                  type="number" 
                  id="base_salary" 
                  name="base_salary" 
                  [(ngModel)]="user.base_salary" 
                  min="0"
                  step="0.01"
                  class="form-control"
                  placeholder="أدخل الراتب الأساسي">
              </div>

              <div class="form-group">
                <label for="official_off_days_per_month">أيام الإجازة الرسمية في الشهر</label>
                <input 
                  type="number" 
                  id="official_off_days_per_month" 
                  name="official_off_days_per_month" 
                  [(ngModel)]="user.official_off_days_per_month" 
                  min="0"
                  max="31"
                  class="form-control"
                  placeholder="أدخل عدد أيام الإجازة">
              </div>
            </div>
          </div>

          <div class="form-section">
            <h4>الصور والوثائق</h4>
            <div class="documents-grid">
              <!-- Reference Image (User Avatar) -->
              <div class="document-section">
                <h5>صورة المستخدم</h5>
                <div class="image-upload-section">
                  <div class="current-image" *ngIf="user.reference_image && !imagePreviews.reference_image">
                    <img [src]="user.reference_image" alt="صورة المستخدم الحالية" class="document-image">
                    <button type="button" class="remove-image-btn" (click)="removeImage('reference_image')">×</button>
                  </div>
                  <div class="image-upload" *ngIf="!user.reference_image && !imagePreviews.reference_image">
                    <input 
                      type="file" 
                      id="referenceImageUpload" 
                      accept="image/*" 
                      (change)="onImageSelected($event, 'reference_image')"
                      style="display: none;">
                    <label for="referenceImageUpload" class="upload-label">
                      <span class="upload-icon">📷</span>
                      <span>اختر صورة</span>
                    </label>
                  </div>
                  <div class="image-preview" *ngIf="imagePreviews.reference_image">
                    <img [src]="imagePreviews.reference_image" alt="معاينة الصورة" class="preview-image">
                    <button type="button" class="remove-preview-btn" (click)="removePreview('reference_image')">×</button>
                  </div>
                </div>
              </div>

              <!-- Front ID Image -->
              <div class="document-section">
                <h5>صورة الهوية الأمامية</h5>
                <div class="image-upload-section">
                  <div class="current-image" *ngIf="user.front_id_image && !imagePreviews.front_id_image">
                    <img [src]="user.front_id_image" alt="صورة الهوية الأمامية" class="document-image">
                    <button type="button" class="remove-image-btn" (click)="removeImage('front_id_image')">×</button>
                  </div>
                  <div class="image-upload" *ngIf="!user.front_id_image && !imagePreviews.front_id_image">
                    <input 
                      type="file" 
                      id="frontIdImageUpload" 
                      accept="image/*" 
                      (change)="onImageSelected($event, 'front_id_image')"
                      style="display: none;">
                    <label for="frontIdImageUpload" class="upload-label">
                      <span class="upload-icon">🆔</span>
                      <span>اختر صورة</span>
                    </label>
                  </div>
                  <div class="image-preview" *ngIf="imagePreviews.front_id_image">
                    <img [src]="imagePreviews.front_id_image" alt="معاينة الصورة" class="preview-image">
                    <button type="button" class="remove-preview-btn" (click)="removePreview('front_id_image')">×</button>
                  </div>
                </div>
              </div>

              <!-- Back ID Image -->
              <div class="document-section">
                <h5>صورة الهوية الخلفية</h5>
                <div class="image-upload-section">
                  <div class="current-image" *ngIf="user.back_id_image && !imagePreviews.back_id_image">
                    <img [src]="user.back_id_image" alt="صورة الهوية الخلفية" class="document-image">
                    <button type="button" class="remove-image-btn" (click)="removeImage('back_id_image')">×</button>
                  </div>
                  <div class="image-upload" *ngIf="!user.back_id_image && !imagePreviews.back_id_image">
                    <input 
                      type="file" 
                      id="backIdImageUpload" 
                      accept="image/*" 
                      (change)="onImageSelected($event, 'back_id_image')"
                      style="display: none;">
                    <label for="backIdImageUpload" class="upload-label">
                      <span class="upload-icon">🆔</span>
                      <span>اختر صورة</span>
                    </label>
                  </div>
                  <div class="image-preview" *ngIf="imagePreviews.back_id_image">
                    <img [src]="imagePreviews.back_id_image" alt="معاينة الصورة" class="preview-image">
                    <button type="button" class="remove-preview-btn" (click)="removePreview('back_id_image')">×</button>
                  </div>
                </div>
              </div>

              <!-- Feesh Image -->
              <div class="document-section">
                <h5>صورة الفيش</h5>
                <div class="image-upload-section">
                  <div class="current-image" *ngIf="user.feesh_image && !imagePreviews.feesh_image">
                    <img [src]="user.feesh_image" alt="صورة الفيش" class="document-image">
                    <button type="button" class="remove-image-btn" (click)="removeImage('feesh_image')">×</button>
                  </div>
                  <div class="image-upload" *ngIf="!user.feesh_image && !imagePreviews.feesh_image">
                    <input 
                      type="file" 
                      id="feeshImageUpload" 
                      accept="image/*" 
                      (change)="onImageSelected($event, 'feesh_image')"
                      style="display: none;">
                    <label for="feeshImageUpload" class="upload-label">
                      <span class="upload-icon">📄</span>
                      <span>اختر صورة</span>
                    </label>
                  </div>
                  <div class="image-preview" *ngIf="imagePreviews.feesh_image">
                    <img [src]="imagePreviews.feesh_image" alt="معاينة الصورة" class="preview-image">
                    <button type="button" class="remove-preview-btn" (click)="removePreview('feesh_image')">×</button>
                  </div>
                </div>
              </div>

              <!-- Medical Certificate Image -->
              <div class="document-section">
                <h5>الشهادة الطبية</h5>
                <div class="image-upload-section">
                  <div class="current-image" *ngIf="user.medical_certificate_image && !imagePreviews.medical_certificate_image">
                    <img [src]="user.medical_certificate_image" alt="الشهادة الطبية" class="document-image">
                    <button type="button" class="remove-image-btn" (click)="removeImage('medical_certificate_image')">×</button>
                  </div>
                  <div class="image-upload" *ngIf="!user.medical_certificate_image && !imagePreviews.medical_certificate_image">
                    <input 
                      type="file" 
                      id="medicalCertificateImageUpload" 
                      accept="image/*" 
                      (change)="onImageSelected($event, 'medical_certificate_image')"
                      style="display: none;">
                    <label for="medicalCertificateImageUpload" class="upload-label">
                      <span class="upload-icon">🏥</span>
                      <span>اختر صورة</span>
                    </label>
                  </div>
                  <div class="image-preview" *ngIf="imagePreviews.medical_certificate_image">
                    <img [src]="imagePreviews.medical_certificate_image" alt="معاينة الصورة" class="preview-image">
                    <button type="button" class="remove-preview-btn" (click)="removePreview('medical_certificate_image')">×</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="form-section">
            <h4>إعدادات الحساب</h4>
            <div class="form-grid">
              <div class="form-group">
                <label for="passcode" *ngIf="!userId">كود المرور <span class="required">*</span></label>
                <label for="passcode" *ngIf="userId">كود المرور الجديد</label>
                <input 
                  type="password" 
                  id="passcode" 
                  name="passcode" 
                  [(ngModel)]="user.passcode" 
                  [required]="!userId"
                  class="form-control"
                  placeholder="أدخل كود المرور"
                  [class.is-invalid]="submitted && userForm.controls['passcode'].errors">
                <div class="invalid-feedback" *ngIf="submitted && userForm.controls['passcode'].errors">
                  كود المرور مطلوب
                </div>
                <small class="form-hint" *ngIf="userId">اتركه فارغاً إذا كنت لا تريد تغيير كود المرور</small>
              </div>

              <div class="form-group">
                <label class="checkbox">
                  <input 
                    type="checkbox" 
                    [(ngModel)]="user.is_active" 
                    name="is_active">
                  <span>الحساب نشط</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <app-button 
              type="submit" 
              variant="primary" 
              [loading]="saving"
              [disabled]="!userForm.form.valid || saving">
              {{ userId ? 'حفظ التغييرات' : 'إضافة المستخدم' }}
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

    .user-form {
      max-width: 1000px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    .form-section {
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 2rem;
      background: #ffffff;
      margin-bottom: 2.5rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
      width: 100%;
      box-sizing: border-box;
      overflow: hidden;
    }

    .form-section:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    }

    .form-section h4 {
      margin: 0 0 1.5rem 0;
      color: var(--color-primary-dark);
      font-size: 1.2rem;
      font-weight: 600;
      border-bottom: 2px solid var(--color-primary);
      padding-bottom: 0.75rem;
      position: relative;
    }

    .form-section h4::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 50px;
      height: 2px;
      background: var(--color-primary);
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 3rem;
      align-items: start;
    }

    .form-group {
      margin-bottom: 1.5rem;
      display: flex;
      flex-direction: column;
      min-width: 0;
      width: 100%;
    }

    .form-group:last-child {
      margin-bottom: 0;
    }

    .form-group.full-width {
      grid-column: 1 / -1;
    }

    label {
      display: block;
      margin-bottom: 0.75rem;
      font-weight: 600;
      color: var(--text-color);
      font-size: 0.95rem;
    }

    .required {
      color: #dc3545;
      font-weight: 700;
    }

    .form-control {
      width: 100%;
      padding: 1rem 1.25rem;
      border: 2px solid var(--border-color);
      border-radius: 8px;
      font-size: 1rem;
      line-height: 1.5;
      background: white;
      transition: all 0.3s ease;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      box-sizing: border-box;
      min-width: 0;
    }

    .form-control:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(246, 184, 25, 0.15);
      transform: translateY(-1px);
    }

    .form-control:hover {
      border-color: var(--color-primary);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .form-control.is-invalid {
      border-color: #dc3545;
      box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.15);
    }

    .invalid-feedback {
      width: 100%;
      margin-top: 0.5rem;
      font-size: 0.875em;
      color: #dc3545;
      font-weight: 500;
    }

    .form-hint {
      display: block;
      margin-top: 0.25rem;
      font-size: 0.8rem;
      color: var(--muted-text);
    }

    .checkbox {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }

    .checkbox input[type="checkbox"] {
      width: auto;
      margin: 0;
    }

    .documents-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      margin-top: 1rem;
    }

    .document-section {
      border: 2px solid var(--border-color);
      border-radius: 12px;
      padding: 1.5rem;
      background: #ffffff;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
      position: relative;
    }

    .document-section:hover {
      border-color: var(--color-primary);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    .document-section h5 {
      margin: 0 0 1.25rem 0;
      color: var(--color-primary-dark);
      font-size: 1rem;
      font-weight: 600;
      text-align: center;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border-color);
    }

    .image-upload-section {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      align-items: center;
    }

    .current-image, .image-preview {
      position: relative;
      display: inline-block;
      margin: 0 auto;
    }

    .user-image, .document-image, .preview-image {
      width: 140px;
      height: 140px;
      object-fit: cover;
      border-radius: 12px;
      border: 3px solid var(--border-color);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    }

    .user-image:hover, .document-image:hover, .preview-image:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
    }

    .remove-image-btn, .remove-preview-btn {
      position: absolute;
      top: -10px;
      right: -10px;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #dc3545;
      color: white;
      border: 2px solid white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: bold;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      transition: all 0.3s ease;
    }

    .remove-image-btn:hover, .remove-preview-btn:hover {
      background: #c82333;
      transform: scale(1.1);
    }

    .upload-label {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 140px;
      height: 140px;
      border: 3px dashed var(--border-color);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      background: #f8f9fa;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .upload-label:hover {
      border-color: var(--color-primary);
      background: rgba(246, 184, 25, 0.1);
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }

    .upload-icon {
      font-size: 2.5rem;
      margin-bottom: 0.75rem;
      color: var(--muted-text);
    }

    .form-actions {
      display: flex;
      gap: 1.5rem;
      justify-content: flex-end;
      margin-top: 3rem;
      padding: 2rem;
      background: #f8f9fa;
      border-radius: 12px;
      border: 1px solid var(--border-color);
    }

    .error-message {
      background: linear-gradient(135deg, #fee, #fdd);
      border: 2px solid #fcc;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 4px 12px rgba(220, 53, 69, 0.1);
    }

    .error-message span {
      font-size: 1.5rem;
    }

    .error-message p {
      margin: 0;
      color: #c62828;
      flex: 1;
      font-weight: 500;
    }

    .form-error {
      background: linear-gradient(135deg, #fee, #fdd);
      border: 2px solid #fcc;
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      color: #c62828;
      margin-top: 2rem;
      box-shadow: 0 4px 12px rgba(220, 53, 69, 0.1);
    }

    @media (max-width: 768px) {
      .user-form {
        padding: 0 0.5rem;
      }

      .page-header {
        flex-direction: column;
        align-items: stretch;
        margin-bottom: 1.5rem;
      }

      .form-section {
        padding: 1.5rem;
        margin-bottom: 2rem;
      }

      .form-grid {
        grid-template-columns: 1fr;
        gap: 2rem;
      }

      .documents-grid {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }

      .document-section {
        padding: 1.25rem;
      }

      .form-actions {
        flex-direction: column;
        gap: 1rem;
        padding: 1.5rem;
        margin-top: 2rem;
      }

      .user-image, .document-image, .preview-image {
        width: 120px;
        height: 120px;
      }

      .upload-label {
        width: 120px;
        height: 120px;
      }
    }

    @media (max-width: 480px) {
      .form-section {
        padding: 1rem;
        margin-bottom: 1.5rem;
      }

      .document-section {
        padding: 1rem;
      }

      .form-actions {
        padding: 1rem;
      }

      .user-image, .document-image, .preview-image {
        width: 100px;
        height: 100px;
      }

      .upload-label {
        width: 100px;
        height: 100px;
      }
    }
  `]
})
export class UsersFormComponent implements OnInit {
  user: any = {
    full_name: '',
    username: '',
    national_number: '',
    email: '',
    phone: '',
    shift_id: null,
    base_salary: 0,
    official_off_days_per_month: 0,
    passcode: '',
    is_active: true,
    reference_image: null,
    front_id_image: null,
    back_id_image: null,
    feesh_image: null,
    medical_certificate_image: null
  };
  shifts: any[] = [];
  userId: string | null = null;
  loading = false;
  saving = false;
  submitted = false;
  error = '';
  formError = '';
  imagePreviews: any = {
    reference_image: null,
    front_id_image: null,
    back_id_image: null,
    feesh_image: null,
    medical_certificate_image: null
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sb: SupabaseService
  ) {}

  async ngOnInit() {
    this.userId = this.route.snapshot.paramMap.get('id');
    await this.loadShifts();
    if (this.userId) {
      await this.loadUser();
    }
  }

  async loadShifts() {
    try {
      const { data } = await this.sb.rpc('shifts_get');
      this.shifts = data || [];
    } catch (error) {
      console.error('Error loading shifts:', error);
      this.shifts = [];
    }
  }

  async loadUser() {
    if (!this.userId) return;
    
    try {
      this.loading = true;
      this.error = '';
      const { data, error } = await this.sb.rpc('users_get_by_id', { _id: this.userId });
      
      if (error) throw error;
      if (!data) throw new Error('User not found');
      
      this.user = {
        full_name: data.full_name || '',
        username: data.username || '',
        national_number: data.national_number || '',
        email: data.email || '',
        phone: data.phone || '',
        shift_id: data.shift_id,
        base_salary: Number(data.base_salary ?? 0),
        official_off_days_per_month: Number(data.official_off_days_per_month ?? 0),
        passcode: '',
        is_active: data.is_active ?? true,
        reference_image: data.reference_image,
        front_id_image: data.front_id_image,
        back_id_image: data.back_id_image,
        feesh_image: data.feesh_image,
        medical_certificate_image: data.medical_certificate_image
      };
    } catch (error: any) {
      console.error('Error loading user:', error);
      this.error = 'حدث خطأ أثناء تحميل بيانات المستخدم';
    } finally {
      this.loading = false;
    }
  }

  onImageSelected(event: any, imageType: string) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        // Clear any existing image first
        this.user[imageType] = null;
        // Set the preview
        this.imagePreviews[imageType] = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(imageType: string) {
    this.user[imageType] = null;
    this.imagePreviews[imageType] = null;
  }

  removePreview(imageType: string) {
    this.imagePreviews[imageType] = null;
    // Don't clear user[imageType] here as it might contain the original saved image
  }

  async onSubmit() {
    this.submitted = true;
    this.formError = '';
    
    if (!this.user.full_name?.trim() || !this.user.username?.trim()) {
      this.formError = 'يرجى ملء الاسم الكامل واسم المستخدم';
      return;
    }

    if (!this.userId && !this.user.passcode?.trim()) {
      this.formError = 'كود المرور مطلوب للمستخدمين الجدد';
      return;
    }

    try {
      this.saving = true;
      
      const userData: any = {
        full_name: this.user.full_name.trim(),
        username: this.user.username.trim(),
        national_number: this.user.national_number?.trim() || null,
        email: this.user.email?.trim() || null,
        phone: this.user.phone?.trim() || null,
        shift_id: this.user.shift_id,
        base_salary: this.user.base_salary !== null && this.user.base_salary !== undefined ? Number(this.user.base_salary) : 0,
        official_off_days_per_month: this.user.official_off_days_per_month !== null && this.user.official_off_days_per_month !== undefined ? Number(this.user.official_off_days_per_month) : 0,
        is_active: this.user.is_active,
        reference_image: this.imagePreviews.reference_image || this.user.reference_image,
        front_id_image: this.imagePreviews.front_id_image || this.user.front_id_image,
        back_id_image: this.imagePreviews.back_id_image || this.user.back_id_image,
        feesh_image: this.imagePreviews.feesh_image || this.user.feesh_image,
        medical_certificate_image: this.imagePreviews.medical_certificate_image || this.user.medical_certificate_image
      };

      // Only include passcode if it's provided - hash it using crypt for authentication compatibility
      if (this.user.passcode?.trim()) {
        try {
          const { data: hashedPasscode, error: hashError } = await this.sb.rpc('hash_passcode_for_storage', {
            p_passcode: this.user.passcode.trim()
          });
          
          if (hashError) {
            console.error('Error hashing passcode:', hashError);
            throw new Error('فشل في تشفير كود المرور');
          }
          
          userData.passcode = hashedPasscode;
        } catch (error) {
          console.error('Exception hashing passcode:', error);
          throw new Error('فشل في تشفير كود المرور');
        }
      }
      
      if (this.userId) {
        const { error } = await this.sb.rpc('users_update', {
          _id: this.userId,
          _username: userData.username,
          _full_name: userData.full_name,
          _national_number: userData.national_number,
          _email: userData.email,
          _phone: userData.phone,
          _is_active: userData.is_active,
          _shift_id: userData.shift_id,
          _reference_image: userData.reference_image,
          _front_id_image: userData.front_id_image,
          _back_id_image: userData.back_id_image,
          _feesh_image: userData.feesh_image,
          _medical_certificate_image: userData.medical_certificate_image,
          _base_salary: userData.base_salary,
          _official_off_days_per_month: userData.official_off_days_per_month,
          _passcode: userData.passcode
        });
        if (error) throw error;
      } else {
        const { error } = await this.sb.rpc('users_insert', {
          _username: userData.username,
          _full_name: userData.full_name,
          _national_number: userData.national_number,
          _email: userData.email,
          _phone: userData.phone,
          _is_active: userData.is_active,
          _shift_id: userData.shift_id,
          _reference_image: userData.reference_image,
          _front_id_image: userData.front_id_image,
          _back_id_image: userData.back_id_image,
          _feesh_image: userData.feesh_image,
          _medical_certificate_image: userData.medical_certificate_image,
          _base_salary: userData.base_salary,
          _official_off_days_per_month: userData.official_off_days_per_month,
          _passcode: userData.passcode
        });
        if (error) throw error;
      }
      
      this.router.navigate(['/users']);
    } catch (error: any) {
      console.error('Error saving user:', error);
      this.formError = this.userId 
        ? 'حدث خطأ أثناء تحديث المستخدم' 
        : 'حدث خطأ أثناء إضافة المستخدم';
    } finally {
      this.saving = false;
    }
  }

  goBack() {
    this.router.navigate(['/users']);
  }
}
