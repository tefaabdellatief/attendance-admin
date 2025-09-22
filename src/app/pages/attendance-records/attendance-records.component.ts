import { Component, OnInit, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/supabase.service';
import { ButtonComponent } from '../../core/ui/components/button/button.component';
import { EnhancedSearchComponent } from '../../core/ui/components/enhanced-search/enhanced-search.component';
import { ImageViewerComponent } from '../../core/ui/components/image-viewer/image-viewer.component';

@Component({
  selector: 'app-attendance-records',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, EnhancedSearchComponent, ImageViewerComponent],
  template: `
    <h2>سجلات الحضور</h2>
    <div class="actions-bar">
      <div class="search-section">
        <app-enhanced-search
          [(ngModel)]="searchQuery"
          placeholder="البحث بالمستخدم أو الفرع أو النوع..."
          (search)="filterRecords()"
          (clear)="clearSearch()">
        </app-enhanced-search>
      </div>
      <div class="actions-section">
        <app-button variant="primary" (btnClick)="openCreate()">➕ سجل جديد</app-button>
      </div>
    </div>

    <!-- Filters: User and Month -->
    <div class="filters-bar">
      <div class="filter-item">
        <label for="filterUser">المستخدم</label>
        <select id="filterUser" [(ngModel)]="selectedUserId" (ngModelChange)="onUserChange($event)">
          <option [ngValue]="null" disabled>اختر مستخدمًا</option>
          <option *ngFor="let u of users" [ngValue]="u.id">{{ u.full_name || u.username }}</option>
        </select>
      </div>
      <div class="filter-item">
        <label for="filterMonth">الشهر</label>
        <input id="filterMonth" type="month" [(ngModel)]="selectedMonth" (ngModelChange)="onMonthChange($event)" />
      </div>
      <div class="filter-item toggle-thumb">
        <label class="checkbox-inline">
          <input type="checkbox" [(ngModel)]="showThumbnails" />
          <span>عرض الصور المصغرة</span>
        </label>
      </div>
    </div>

    <!-- Add/Edit Record Modal -->
    <div class="modal-overlay" [class.visible]="modalOpen" (click)="onOverlayClick($event)">
      <div class="modal user-modal" [class.visible]="modalOpen">
        <div class="modal-header">
          <h3>{{ editMode ? 'تعديل سجل الحضور' : 'إضافة سجل حضور جديد' }}</h3>
          <button class="close-btn" (click)="closeModal()" aria-label="إغلاق">
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div class="modal-body">
          <form (ngSubmit)="confirm ? onConfirmSave() : requestSave()" #f="ngForm">
            <div class="form-grid">
              <div class="form-group">
                <label for="user">المستخدم *</label>
                <select id="user" [(ngModel)]="form.user_id" name="user_id" required [disabled]="saving">
                  <option [ngValue]="null" disabled>اختر مستخدمًا</option>
                  <option *ngFor="let u of users" [ngValue]="u.id">{{ u.full_name || u.username }}</option>
                </select>
              </div>
              <div class="form-group">
                <label for="branch">الفرع *</label>
                <select id="branch" [(ngModel)]="form.branch_id" name="branch_id" required [disabled]="saving">
                  <option [ngValue]="null" disabled>اختر فرعًا</option>
                  <option *ngFor="let b of branches" [ngValue]="b.id">{{ b.name }}</option>
                </select>
              </div>
              <div class="form-group">
                <label for="type">نوع الحضور *</label>
                <select id="type" [(ngModel)]="form.attendance_type_id" name="attendance_type_id" required [disabled]="saving">
                  <option [ngValue]="null" disabled>اختر النوع</option>
                  <option *ngFor="let t of types" [ngValue]="t.id">{{ t.name }}</option>
                </select>
              </div>

              <div class="form-group">
                <label for="recorded_at">وقت التسجيل *</label>
                <input id="recorded_at" [(ngModel)]="form.recorded_at" name="recorded_at" type="datetime-local" required [disabled]="saving" />
              </div>
              <div class="form-group">
                <label for="image_url">رابط الصورة</label>
                <input id="image_url" [(ngModel)]="form.image_url" name="image_url" [disabled]="saving" />
              </div>
              <div class="form-group">
                <label for="latitude">خط العرض</label>
                <input id="latitude" [(ngModel)]="form.latitude" name="latitude" type="number" step="any" [disabled]="saving" />
              </div>
              <div class="form-group">
                <label for="longitude">خط الطول</label>
                <input id="longitude" [(ngModel)]="form.longitude" name="longitude" type="number" step="any" [disabled]="saving" />
              </div>
              <div class="form-group">
                <label for="worked_minutes">دقائق العمل</label>
                <input id="worked_minutes" [(ngModel)]="form.worked_minutes" name="worked_minutes" type="number" min="0" step="1" [disabled]="saving" />
              </div>

              <div class="form-group">
                <label class="checkbox">
                  <input [(ngModel)]="form.is_late" name="is_late" type="checkbox" [disabled]="saving" />
                  <span>متأخر؟</span>
                </label>
              </div>
              <div class="form-group">
                <label class="checkbox">
                  <input [(ngModel)]="form.is_early_leave" name="is_early_leave" type="checkbox" [disabled]="saving" />
                  <span>انصراف مبكر؟</span>
                </label>
              </div>
              <div class="form-group">
                <label class="checkbox">
                  <input [(ngModel)]="form.is_auto" name="is_auto" type="checkbox" [disabled]="saving" />
                  <span>تلقائي؟</span>
                </label>
              </div>

              <div class="form-group full-width">
                <label for="notes">ملاحظات</label>
                <input id="notes" [(ngModel)]="form.notes" name="notes" [disabled]="saving" />
              </div>
              <div class="form-group full-width">
                <label for="absence_reason">سبب الغياب</label>
                <input id="absence_reason" [(ngModel)]="form.absence_reason" name="absence_reason" [disabled]="saving" />
              </div>
            </div>

            <p class="error-message" *ngIf="formError">
              <span>⚠️</span> {{ formError }}
            </p>
          </form>
        </div>
        
        <!-- Actions Footer -->
        <div class="modal-footer-actions" *ngIf="!confirm">
          <div class="action-buttons">
            <app-button type="button" variant="outline" (click)="closeModal()" [disabled]="saving">إلغاء</app-button>
            <app-button type="button" variant="primary" (click)="requestSave()" [disabled]="saving || !f.form.valid">{{ editMode ? 'حفظ التغييرات' : 'إنشاء السجل' }}</app-button>
          </div>
          <p class="hint-text">جميع الحقول المميزة بعلامة (*) إلزامية</p>
        </div>
        
        <!-- Confirmation Footer -->
        <div class="modal-footer-actions" *ngIf="confirm">
          <div class="confirmation-message">
            <p>هل أنت متأكد من {{ editMode ? 'تحديث' : 'إنشاء' }} السجل للمستخدم "{{ userName(form.user_id) }}"؟</p>
            <div class="action-buttons">
              <app-button type="button" variant="outline" (click)="confirm = false" [disabled]="saving">رجوع</app-button>
              <app-button type="button" variant="primary" (click)="onConfirmSave()" [disabled]="saving || !f.form.valid">{{ saving ? 'جاري الحفظ...' : 'تأكيد' }}</app-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="modal-overlay" [class.visible]="showDeleteModal" (click)="onDeleteOverlayClick($event)">
      <div class="modal delete-modal" [class.visible]="showDeleteModal">
        <div class="modal-header">
          <h3>تأكيد حذف سجل الحضور</h3>
          <button class="close-btn" (click)="closeDeleteModal()" aria-label="إغلاق">
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div class="modal-body">
          <div class="delete-warning">
            <div class="warning-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h4>هل أنت متأكد من حذف سجل الحضور؟</h4>
            <p>سيتم حذف السجل بشكل نهائي ولا يمكن استرجاعه لاحقًا.</p>
          </div>
          <div class="delete-actions">
            <app-button variant="danger" (click)="onConfirmDelete()" [disabled]="saving">{{ saving ? 'جاري الحذف...' : 'نعم، احذف السجل' }}</app-button>
            <app-button variant="outline" (click)="closeDeleteModal()" [disabled]="saving">إلغاء</app-button>
          </div>
        </div>
      </div>
    </div>

    <p *ngIf="loading">جاري التحميل...</p>
    <p class="error" *ngIf="error">{{ error }}</p>
    <div *ngIf="!loading && !selectedUserId" class="hint-select-user">الرجاء اختيار مستخدم لعرض سجلات الشهر.</div>
    <div class="table-container" *ngIf="!loading && selectedUserId && filteredItems.length">
    <table class="app-table">
      <thead>
        <tr>
          <th>المستخدم</th>
          <th>الفرع</th>
          <th>النوع</th>
          <th>وقت التسجيل</th>
          <th>الصورة</th>
          <th>خط العرض</th>
          <th>خط الطول</th>
          <th>دقائق العمل</th>
          <th>متأخر</th>
          <th>انصراف مبكر</th>
          <th>تلقائي</th>
          <th>ملاحظات</th>
          <th>سبب الغياب</th>
          <th>الإجراءات</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let r of filteredItems">
          <td>{{ userName(r.user_id) }}</td>
          <td>{{ r.branch_name || branchName(r.branch_id) }}</td>
          <td>{{ r.attendance_type || typeName(r.attendance_type_id) }}</td>
          <td>{{ r.recorded_at | date:'short' }}</td>
          <td>
            <ng-container *ngIf="imageSrc(r.image_url) as src; else noimg">
              <button type="button" class="thumb-btn" (click)="openImageViewer(src)">
                <img *ngIf="showThumbnails" [src]="src" alt="thumb" class="thumb" />
                <span *ngIf="!showThumbnails" class="open-img-text">عرض الصورة</span>
              </button>
            </ng-container>
            <ng-template #noimg>-</ng-template>
          </td>
          <td>
            {{ r.latitude ?? '-' }}
          </td>
          <td>
            {{ r.longitude ?? '-' }}
            <a *ngIf="r.latitude != null && r.longitude != null" 
               [href]="mapUrl(r.latitude, r.longitude)" 
               class="map-link" target="_blank" rel="noopener" title="فتح الموقع على الخرائط">
              خريطة
            </a>
          </td>
          <td>{{ r.worked_minutes ?? '-' }}</td>
          <td>{{ r.is_late ? '✓' : '—' }}</td>
          <td>{{ r.is_early_leave ? '✓' : '—' }}</td>
          <td>{{ r.is_auto ? '✓' : '—' }}</td>
          <td>{{ r.notes || '-' }}</td>
          <td>{{ r.absence_reason || '-' }}</td>
          <td class="actions">
            <div class="action-buttons">
              <app-button variant="outline" size="sm" (btnClick)="startEdit(r)" [disabled]="saving">
                <span class="btn-icon">✏️</span>
                تعديل
              </app-button>
              <app-button variant="danger" size="sm" (btnClick)="openDeleteModal(r)" [disabled]="saving">
                <span class="btn-icon">🗑️</span>
                حذف
              </app-button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    </div>
    <p *ngIf="!loading && selectedUserId && !filteredItems.length && !error">لا يوجد سجلات.</p>

    <!-- Image Viewer Modal -->
    <app-image-viewer
      [visible]="imageViewerVisible"
      [src]="imageViewerSrc"
      [alt]="'صورة سجل الحضور'"
      (close)="closeImageViewer()">
    </app-image-viewer>
  `,
  styles: [`
    :host {
      direction: rtl;
      text-align: right;
      --primary-color: #f6b819;
      --primary-dark: #e0a800;
      --danger-color: #dc3545;
      --border-color: #e2e8f0;
      --text-muted: #64748b;
      --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      --radius-md: 8px;
      --radius-lg: 12px;
      --transition: all 0.2s ease-in-out;
    }

    .actions-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 1.5rem 0;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .search-section { 
      flex: 1; 
      min-width: 320px;
      max-width: 100%;
    }
    .actions-section { display: flex; gap: .75rem; flex-wrap: wrap; }

    .filters-bar {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      margin: 0 0 1rem 0;
    }
    .filter-item { min-width: 220px; }
    .filter-item label { display:block; margin-bottom: .35rem; color: #334155; font-weight: 600; }
    .filter-item select, .filter-item input[type='month'] { width:100%; padding: 0.5rem 0.75rem; border:1px solid var(--border-color); border-radius: var(--radius-md); }
    .filter-item.toggle-thumb { display:flex; align-items: end; min-width: 180px; }
    .checkbox-inline { display: inline-flex; align-items: center; gap: .5rem; margin-bottom: .35rem; }

    .hint-select-user { margin: .5rem 0 1rem; color: var(--text-muted); font-weight: 500; }

    .table-container { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .app-table { width: 100%; border-collapse: separate; border-spacing: 0; background: white; border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); overflow: hidden; }
    .app-table th { background: var(--primary-dark); color: white; padding: 0.75rem 1rem; text-align: right; font-weight: 600; }
    .app-table td { padding: 0.75rem 1rem; border-top: 1px solid var(--border-color); vertical-align: middle; }
    .actions { white-space: nowrap; }
    .action-buttons { display: flex; gap: 0.5rem; justify-content: flex-end; }
    .btn-icon { margin-left: 0.25rem; }
    .thumb { width: 48px; height: 48px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border-color); }
    .thumb-btn { background: none; border: none; padding: 0; margin: 0; cursor: zoom-in; }
    .img-link { text-decoration: none; color: inherit; }
    .open-img-text { padding: 4px 8px; background: #f1f5f9; border-radius: 6px; border: 1px solid var(--border-color); font-size: .85rem; color: #334155; }
    .map-link { margin-inline-start: 8px; padding: 2px 6px; background: #e8f3ff; border: 1px solid #cfe3ff; border-radius: 6px; color: #0b5ed7; font-weight: 600; font-size: .8rem; text-decoration: none; }
    .map-link:hover { background: #dff0ff; }

    /* Modal Styles aligned with Users module */
    .modal-overlay { position: fixed; inset: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.5); display: grid; place-items: center; z-index: 100000; opacity: 0; visibility: hidden; transition: var(--transition); padding: 2rem; overflow: auto; }
    .modal-overlay.visible { opacity: 1; visibility: visible; }
    .modal { background: white; border-radius: 12px; max-width: 90vw; max-height: 90vh; display: flex; flex-direction: column; transform: translateY(20px); transition: var(--transition); opacity: 0; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3); margin: 0; overflow: hidden; }
    .user-modal { width: 800px; }
    .delete-modal { width: 500px; }
    .modal.visible { transform: translateY(0); opacity: 1; }
    .modal-header { padding: 1.5rem; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between; }
    .modal-header h3 { margin: 0; font-size: 1.3rem; font-weight: 600; color: var(--color-primary-dark); }
    .close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--muted-text); padding: 0.25rem; border-radius: 4px; transition: all 0.2s ease; }
    .close-btn:hover { background: var(--border-color); color: var(--text-color); }
    .modal-body { padding: 1.5rem; overflow-y: auto; flex: 1; }

    .form-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; margin-bottom: 1.5rem; }
    .form-group { margin-bottom: 0.25rem; }
    .form-group.full-width { grid-column: 1 / -1; }
    label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #334155; font-size: 0.9375rem; }
    input, textarea, select { width: 100%; padding: 0.625rem 0.875rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.9375rem; transition: var(--transition); background-color: white; }
    input:focus, textarea:focus, select:focus { outline: none; border-color: var(--primary-color); box-shadow: 0 0 0 3px rgba(246, 184, 25, 0.2); }
    .checkbox { display: flex; align-items: center; gap: 0.5rem; margin-top: 1.75rem; }

    .modal-footer-actions { padding: 1rem 1.5rem; border-top: 1px solid var(--border-color); background: #f8fafc; border-bottom-left-radius: var(--radius-lg); border-bottom-right-radius: var(--radius-lg); margin-top: auto; }
    .action-buttons { display: flex; justify-content: flex-end; gap: 0.75rem; margin-bottom: 0.75rem; }
    .confirmation-message { text-align: center; }
    .confirmation-message p { margin: 0 0 1rem; color: #1e293b; font-weight: 500; }
    .hint-text { color: var(--text-muted); font-size: 0.875rem; margin: 0; text-align: center; }

    .delete-warning { text-align: center; padding: 1rem 0; }
    .warning-icon { margin-bottom: 1rem; }
    .delete-warning h4 { margin: 0 0 0.5rem; font-size: 1.125rem; color: #1e293b; }
    .delete-warning p { margin: 0; color: #64748b; line-height: 1.5; }
    .delete-actions { display: flex; justify-content: center; gap: 0.75rem; margin-top: 1.5rem; }

    .error-message { color: var(--danger-color); background-color: #fef2f2; padding: 0.75rem 1rem; border-radius: var(--radius-md); margin: 1rem 0 0; display: flex; align-items: flex-start; gap: 0.5rem; font-size: 0.9375rem; }

    @media (max-width: 900px) {
      .form-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
    }
    @media (max-width: 640px) {
      .actions-bar { flex-direction: column; align-items: stretch; }
      .search-section { max-width: 100%; }
      .action-buttons, .delete-actions { flex-direction: column; width: 100%; }
      app-button { width: 100%; justify-content: center; }
      .form-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class AttendanceRecordsComponent implements OnInit {
  users: any[] = [];
  branches: any[] = [];
  types: any[] = [];
  items: any[] = [];
  filteredItems: any[] = [];
  searchQuery: string = '';
  loading = false;
  saving = false;
  error = '';
  formError = '';

  // Filters
  selectedUserId: string | null = null;
  selectedMonth: string = ''; // format: YYYY-MM
  private serverFiltered = false;
  showThumbnails = true;
  imageViewerVisible = false;
  imageViewerSrc: string | null = null;

  editMode = false;
  editingId: string | null = null;
  form: any = { user_id: null, branch_id: null, attendance_type_id: null, recorded_at: '', image_url: '', latitude: null, longitude: null, worked_minutes: null, is_late: false, is_early_leave: false, is_auto: false, notes: '', absence_reason: '' };
  modalOpen = false;
  confirm = false;
  showDeleteModal = false;
  typeToDelete: any = null;

  constructor(private sb: SupabaseService, private route: ActivatedRoute, private router: Router) {}

  async ngOnInit() {
    // Default current month
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    this.selectedMonth = `${yyyy}-${mm}`;

    // Optionally accept query params to preselect user/month
    const qp = this.route.snapshot.queryParamMap;
    const qpUser = qp.get('userId');
    const qpMonth = qp.get('month'); // format YYYY-MM
    if (qpMonth && /^\d{4}-\d{2}$/.test(qpMonth)) {
      this.selectedMonth = qpMonth;
    }
    if (qpUser) {
      this.selectedUserId = qpUser;
    }

    await Promise.all([this.loadUsers(), this.loadBranches(), this.loadTypes()]);
    await this.reload();
  }

  async loadUsers() {
    const { data } = await this.sb.rpc('users_get');
    this.users = (data || []) as any[];
  }
  async loadBranches() {
    const { data } = await this.sb.rpc('branches_get');
    this.branches = (data || []) as any[];
  }
  async loadTypes() {
    const { data } = await this.sb.rpc('attendance_types_get');
    this.types = (data || []) as any[];
  }

  filterRecords() {
    this.applyFilters();
  }

  clearSearch() {
    this.searchQuery = '';
    this.applyFilters();
  }

  async reload() {
    this.loading = true;
    try {
      // If user not selected, clear lists and return (wait for selection)
      if (!this.selectedUserId) {
        this.serverFiltered = false;
        this.items = [];
        this.filteredItems = [];
        return;
      }

      // Use server-side RPC for monthly records
      const [yearStr, monthStr] = (this.selectedMonth || '').split('-');
      const year = Number(yearStr);
      const month = Number(monthStr);

      const { data, error } = await this.sb.rpc('get_monthly_attendance_records', {
        p_user_id: this.selectedUserId,
        p_year: year,
        p_month: month,
      });
      if (error) throw error;
      this.items = (Array.isArray(data) ? data : []) as any[];
      this.serverFiltered = true;
      this.applyFilters(); // will only apply search when serverFiltered
    } catch (e: any) {
      this.error = e?.message ?? 'فشل تحميل سجلات الحضور';
    } finally {
      this.loading = false;
    }
  }

  private applyFilters() {
    // If no user selected, show nothing (wait for selection)
    if (!this.selectedUserId) {
      this.filteredItems = [];
      return;
    }
    const query = (this.searchQuery || '').toLowerCase();

    if (this.serverFiltered) {
      // Data already filtered by server to user+month. Apply search only.
      if (!query) {
        this.filteredItems = [...this.items];
        return;
      }
      this.filteredItems = this.items.filter(r => {
        const userName = this.userName(r.user_id).toLowerCase();
        const branchName = (r.branch_name || this.branchName(r.branch_id)).toLowerCase();
        const typeName = (r.attendance_type || this.typeName(r.attendance_type_id)).toLowerCase();
        return userName.includes(query) || branchName.includes(query) || typeName.includes(query);
      });
      return;
    }

    // Client-side filter fallback (not used when serverFiltered)
    const [yearStr, monthStr] = (this.selectedMonth || '').split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    const start = new Date(year, month - 1, 1, 0, 0, 0);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    this.filteredItems = this.items.filter(r => {
      if (r.user_id !== this.selectedUserId) return false;
      const d = new Date(r.recorded_at);
      if (Number.isNaN(d.getTime())) return false;
      if (d < start || d > end) return false;
      if (!query) return true;
      const userName = this.userName(r.user_id).toLowerCase();
      const branchName = this.branchName(r.branch_id).toLowerCase();
      const typeName = this.typeName(r.attendance_type_id).toLowerCase();
      return userName.includes(query) || branchName.includes(query) || typeName.includes(query);
    });
  }

  async onUserChange(_: any) {
    await this.reload();
  }

  async onMonthChange(_: any) {
    await this.reload();
  }

  userName(id: string) { return this.users.find(u => u.id === id)?.full_name || this.users.find(u => u.id === id)?.username || id; }
  branchName(id: string) { return this.branches.find(b => b.id === id)?.name || id; }
  typeName(id: string) { return this.types.find(t => t.id === id)?.name || id; }

  resetForm() {
    this.editMode = false;
    this.editingId = null;
    this.form = { user_id: null, branch_id: null, attendance_type_id: null, recorded_at: '', image_url: '', latitude: null, longitude: null, worked_minutes: null, is_late: false, is_early_leave: false, is_auto: false, notes: '', absence_reason: '' };
    this.formError = '';
    this.confirm = false;
  }

  startEdit(r: any) {
    this.editMode = true;
    this.editingId = r.id;
    // Convert ISO to datetime-local compatible value
    const toLocalInput = (iso?: string) => iso ? iso.substring(0, 16) : '';
    this.form = {
      user_id: r.user_id,
      branch_id: r.branch_id,
      attendance_type_id: r.attendance_type_id,
      recorded_at: toLocalInput(r.recorded_at),
      image_url: r.image_url || '',
      latitude: r.latitude ?? null,
      longitude: r.longitude ?? null,
      worked_minutes: r.worked_minutes ?? null,
      is_late: !!r.is_late,
      is_early_leave: !!r.is_early_leave,
      is_auto: !!r.is_auto,
      notes: r.notes || '',
      absence_reason: r.absence_reason || ''
    };
    this.formError = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.confirm = false;
    this.modalOpen = true;
  }

  async submitForm() {
    this.formError = '';
    this.saving = true;
    try {
      // Convert types as needed
      const toISO = (v?: string) => v ? new Date(v).toISOString() : null;
      const toNum = (v: any) => (v !== null && v !== '' ? Number(v) : null);
      const toInt = (v: any) => (v !== null && v !== '' ? parseInt(v, 10) : null);
      const payload = {
        user_id: this.form.user_id,
        branch_id: this.form.branch_id,
        attendance_type_id: this.form.attendance_type_id,
        recorded_at: toISO(this.form.recorded_at) || new Date().toISOString(),
        image_url: this.form.image_url || null,
        latitude: toNum(this.form.latitude),
        longitude: toNum(this.form.longitude),
        worked_minutes: toInt(this.form.worked_minutes),
        is_late: !!this.form.is_late,
        is_early_leave: !!this.form.is_early_leave,
        is_auto: !!this.form.is_auto,
        notes: this.form.notes || null,
        absence_reason: (this.form.absence_reason || '').trim() || null,
      };
      if (this.editMode && this.editingId) {
        const { error } = await this.sb.rpc('attendance_records_update', { _id: this.editingId, ...payload });
        if (error) throw error;
      } else {
        const { error } = await this.sb.rpc('attendance_records_insert', payload);
        if (error) throw error;
      }
      await this.reload();
      this.resetForm();
      this.closeModal();
    } catch (e: any) {
      this.formError = e?.message ?? 'فشل حفظ السجل';
    } finally {
      this.saving = false;
    }
  }

  openCreate() {
    this.resetForm();
    this.editMode = false;
    this.modalOpen = true;
  }
  closeModal() {
    this.modalOpen = false;
    this.confirm = false;
  }
  requestSave() {
    this.formError = '';
    this.confirm = true;
  }
  async onConfirmSave() {
    await this.submitForm();
  }

  // Close on overlay click (outside modal). If in confirm mode, exit confirm first.
  onOverlayClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target) return;
    if (target.classList.contains('modal-overlay')) {
      if (this.confirm) this.confirm = false; else this.closeModal();
    }
  }

  // ESC key to close modal or exit confirmation first
  @HostListener('window:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.modalOpen) {
      event.preventDefault();
      if (this.confirm) this.confirm = false; else this.closeModal();
    }
  }

  // Delete modal controls
  openDeleteModal(record: any) {
    this.typeToDelete = record;
    this.showDeleteModal = true;
  }
  closeDeleteModal() {
    this.showDeleteModal = false;
    this.typeToDelete = null;
  }
  onDeleteOverlayClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target?.classList?.contains('modal-overlay')) {
      this.closeDeleteModal();
    }
  }
  async onConfirmDelete() {
    if (!this.typeToDelete) return;
    this.saving = true;
    try {
      const { error } = await this.sb.rpc('attendance_records_delete', { _id: this.typeToDelete.id });
      if (error) throw error;
      await this.reload();
      this.closeDeleteModal();
    } catch (e: any) {
      const msg = e?.message || '';
      const isFK = (e?.code === '23503') || /foreign key|violates foreign key constraint/i.test(msg);
      this.error = isFK
        ? 'تعذر حذف السجل لوجود سجلات مرتبطة به. يرجى التحقق من العلاقات المرتبطة أولاً.'
        : (msg || 'حدث خطأ أثناء حذف السجل');
    } finally {
      this.saving = false;
    }
  }

  imageSrc(v?: string | null): string {
    if (!v) return '';
    const trimmed = v.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('data:image/')) return trimmed;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    // if looks like base64 without data URI prefix, assume jpeg
    const base64Re = /^[A-Za-z0-9+/=]+$/;
    if (base64Re.test(trimmed)) return `data:image/jpeg;base64,${trimmed}`;
    return '';
  }

  mapUrl(lat?: number | null, lng?: number | null): string {
    if (lat == null || lng == null) return '';
    const qs = `${lat},${lng}`;
    return `https://www.google.com/maps?q=${encodeURIComponent(qs)}`;
  }

  openImageViewer(src: string) {
    this.imageViewerSrc = src;
    this.imageViewerVisible = true;
  }

  closeImageViewer() {
    this.imageViewerVisible = false;
    this.imageViewerSrc = null;
  }
}
