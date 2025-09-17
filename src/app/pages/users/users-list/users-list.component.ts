import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/supabase.service';
import { SpinnerComponent } from '../../../core/ui/components/spinner/spinner.component';
import { CardComponent } from '../../../core/ui/components/card/card.component';
import { DeleteConfirmationComponent } from '../../../core/ui/components/delete-confirmation/delete-confirmation.component';
import { EnhancedSearchComponent } from '../../../core/ui/components/enhanced-search/enhanced-search.component';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SpinnerComponent, CardComponent, DeleteConfirmationComponent, EnhancedSearchComponent],
  template: `
    <div class="page-header">
      <div class="header-content">
        <h1>إدارة المستخدمين</h1>
        <p class="page-subtitle">إضافة وتعديل وحذف المستخدمين في النظام</p>
      </div>
      <button 
        type="button"
        class="btn btn-primary"
        [disabled]="loading"
        routerLink="/users/new">
        <span>👤</span> إضافة مستخدم جديد
      </button>
    </div>

    <!-- Search Bar -->
    <div class="search-bar">
      <div class="search-section">
        <app-enhanced-search
          [(ngModel)]="searchQuery"
          placeholder="البحث بالاسم أو اسم المستخدم أو الرقم القومي..."
          (search)="filterUsers()"
          (clear)="clearSearch()">
        </app-enhanced-search>
      </div>
    </div>

    <!-- Loading State -->
    <app-spinner *ngIf="loading" [overlay]="false" message="جاري تحميل المستخدمين..."></app-spinner>

    <!-- Error State -->
    <div *ngIf="error && !loading" class="error-message">
      <span>⚠️</span>
      <p>{{ error }}</p>
      <button type="button" class="btn btn-outline btn-sm" (click)="loadUsers()">إعادة المحاولة</button>
    </div>

    <!-- Users List -->
    <div *ngIf="!loading && !error" class="users-list-container">
      <app-card *ngIf="filteredUsers.length" [title]="'قائمة المستخدمين'" [subtitle]="'إجمالي ' + filteredUsers.length + ' مستخدم'">
        <div class="table-container">
          <table class="app-table">
            <thead>
              <tr>
                <th>الصورة</th>
                <th>الاسم الكامل</th>
                <th>اسم المستخدم</th>
                <th>الرقم القومي</th>
                <th>الهاتف</th>
                <th>الوردية</th>
                <th>الراتب الأساسي</th>
                <th>أيام الإجازة الشهرية</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let user of filteredUsers">
                <td class="user-avatar">
                  <div class="avatar" [style.background-image]="user.reference_image ? 'url(' + user.reference_image + ')' : 'none'">
                    <span>{{ getInitials(user.full_name) }}</span>
                  </div>
                </td>
                <td class="user-name">
                  <span class="name-text">{{ user.full_name }}</span>
                </td>
                <td class="username">
                  <span class="username-text">{{ user.username }}</span>
                </td>
                <td class="national-number">
                  <span class="national-text">{{ user.national_number || '-' }}</span>
                </td>
                <td class="phone">
                  <span class="phone-text">{{ user.phone || '-' }}</span>
                </td>
                <td class="shift-name">
                  <span class="shift-text">{{ getShiftName(user.shift_id) || '-' }}</span>
                </td>
                <td class="base-salary">
                  <span class="salary-text">{{ (user.base_salary ?? 0) | number:'1.0-0' }} جنيه</span>
                </td>
                <td class="off-days">
                  <span class="offdays-text">{{ user.official_off_days_per_month || 0 }} يوم</span>
                </td>
                <td class="actions">
                  <div class="action-buttons">
                    <button 
                      type="button"
                      class="btn btn-primary btn-sm"
                      (click)="viewUser(user)"
                      [disabled]="saving">
                      👁️ عرض
                    </button>
                    <button 
                      type="button"
                      class="btn btn-outline btn-sm"
                      [disabled]="saving || !user.id"
                      [routerLink]="['/users/edit', user.id]">
                      ✏️ تعديل
                    </button>
                    <button 
                      type="button"
                      class="btn btn-danger btn-sm"
                      (click)="deleteUser(user)"
                      [disabled]="saving">
                      🗑️ حذف
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </app-card>

      <!-- Empty State -->
      <div *ngIf="!filteredUsers.length" class="empty-state">
        <div class="empty-icon">👥</div>
        <h3>لا يوجد مستخدمون</h3>
        <p *ngIf="searchQuery">لم يتم العثور على مستخدمين يطابقون البحث المحدد</p>
        <p *ngIf="!searchQuery">لم يتم إضافة أي مستخدمين بعد</p>
        <button 
          *ngIf="!searchQuery" 
          type="button"
          class="btn btn-primary"
          (click)="navigateToNew()">
          إضافة أول مستخدم
        </button>
      </div>
    </div>

    <!-- View User Modal -->
    <div class="modal-overlay" [class.visible]="viewModalVisible" (click)="closeViewModal()">
      <div class="modal" [class.visible]="viewModalVisible" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>عرض بيانات المستخدم</h3>
          <button type="button" (click)="closeViewModal()">×</button>
        </div>
        <div class="modal-body" *ngIf="selectedUser">
          <div class="user-view-container">
            <!-- User Avatar -->
            <div class="user-avatar-section">
              <div class="avatar-large" [style.background-image]="selectedUser.reference_image ? 'url(' + selectedUser.reference_image + ')' : 'none'">
                <span *ngIf="!selectedUser.reference_image">{{ getInitials(selectedUser.full_name) }}</span>
              </div>
              <h2>{{ selectedUser.full_name }}</h2>
              <p class="user-role">{{ selectedUser.username }}</p>
            </div>

            <!-- Personal Information -->
            <div class="info-section">
              <h4>المعلومات الشخصية</h4>
              <div class="info-grid">
                <div class="info-item">
                  <label>الاسم الكامل:</label>
                  <span>{{ selectedUser.full_name }}</span>
                </div>
                <div class="info-item">
                  <label>اسم المستخدم:</label>
                  <span>{{ selectedUser.username }}</span>
                </div>
                <div class="info-item">
                  <label>الرقم القومي:</label>
                  <span>{{ selectedUser.national_number || '-' }}</span>
                </div>
                <div class="info-item">
                  <label>البريد الإلكتروني:</label>
                  <span>{{ selectedUser.email || '-' }}</span>
                </div>
                <div class="info-item">
                  <label>رقم الهاتف:</label>
                  <span>{{ selectedUser.phone || '-' }}</span>
                </div>
                <div class="info-item">
                  <label>الوردية:</label>
                  <span>{{ getShiftName(selectedUser.shift_id) || '-' }}</span>
                </div>
                <div class="info-item">
                  <label>الراتب الأساسي:</label>
                  <span>{{ selectedUser.base_salary || 0 }} جنيه</span>
                </div>
                <div class="info-item">
                  <label>أيام الإجازة الشهرية:</label>
                  <span>{{ selectedUser.official_off_days_per_month || 0 }} يوم</span>
                </div>
                <div class="info-item">
                  <label>حالة الحساب:</label>
                  <span class="status-badge" [class.active]="selectedUser.is_active" [class.inactive]="!selectedUser.is_active">
                    {{ selectedUser.is_active ? 'نشط' : 'غير نشط' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Documents Section -->
            <div class="info-section" *ngIf="hasAnyDocument()">
              <h4>الوثائق المرفقة</h4>
              <div class="documents-view">
                <div class="document-item" *ngIf="selectedUser.reference_image">
                  <h5>صورة المستخدم</h5>
                  <img [src]="selectedUser.reference_image" alt="صورة المستخدم" class="document-thumbnail">
                </div>
                <div class="document-item" *ngIf="selectedUser.front_id_image">
                  <h5>صورة الهوية الأمامية</h5>
                  <img [src]="selectedUser.front_id_image" alt="صورة الهوية الأمامية" class="document-thumbnail">
                </div>
                <div class="document-item" *ngIf="selectedUser.back_id_image">
                  <h5>صورة الهوية الخلفية</h5>
                  <img [src]="selectedUser.back_id_image" alt="صورة الهوية الخلفية" class="document-thumbnail">
                </div>
                <div class="document-item" *ngIf="selectedUser.feesh_image">
                  <h5>صورة الفيش</h5>
                  <img [src]="selectedUser.feesh_image" alt="صورة الفيش" class="document-thumbnail">
                </div>
                <div class="document-item" *ngIf="selectedUser.medical_certificate_image">
                  <h5>الشهادة الطبية</h5>
                  <img [src]="selectedUser.medical_certificate_image" alt="الشهادة الطبية" class="document-thumbnail">
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline" (click)="closeViewModal()">إغلاق</button>
          <button type="button" class="btn btn-primary" (click)="editSelectedUser()">تعديل المستخدم</button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <app-delete-confirmation
      [visible]="deleteModalVisible"
      [title]="'حذف المستخدم'"
      [message]="'هل أنت متأكد من أنك تريد حذف هذا المستخدم؟'"
      [itemName]="userToDelete?.full_name"
      [loading]="saving"
      (confirm)="confirmDelete()"
      (cancel)="cancelDelete()">
    </app-delete-confirmation>
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

    .search-bar {
      margin-bottom: 1.5rem;
    }

    .search-section {
      position: relative;
      max-width: 500px;
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

    .users-list-container {
      margin-top: 1rem;
    }

    .user-avatar {
      width: 60px;
    }

    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--color-primary-light);
      background-size: cover;
      background-position: center;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      color: white;
      font-size: 0.9rem;
      border: 2px solid var(--border-color);
    }

    .user-name {
      min-width: 150px;
    }

    .name-text {
      font-weight: 600;
      color: var(--text-color);
    }

    .username {
      min-width: 120px;
    }

    .username-text {
      font-weight: 500;
      color: var(--text-color);
      font-family: monospace;
    }

    .national-number {
      width: 140px;
    }

    .national-text {
      font-family: monospace;
      color: var(--text-color);
    }

    .email {
      min-width: 200px;
    }

    .email-text {
      color: var(--text-color);
      word-break: break-word;
    }

    .phone {
      width: 120px;
    }

    .phone-text {
      font-family: monospace;
      color: var(--text-color);
    }

    .status {
      width: 100px;
    }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .status-badge.active {
      background: rgba(40, 167, 69, 0.1);
      color: #28a745;
      border: 1px solid rgba(40, 167, 69, 0.3);
    }

    .status-badge.inactive {
      background: rgba(108, 117, 125, 0.1);
      color: #6c757d;
      border: 1px solid rgba(108, 117, 125, 0.3);
    }

    .shift-name {
      min-width: 120px;
    }

    .shift-text {
      color: var(--text-color);
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
      justify-content: center;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
      outline: none;
      text-decoration: none;
    }
    
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .btn-primary {
      background-color: var(--color-primary);
      color: #fff;
    }
    
    .btn-primary:hover:not(:disabled) {
      background-color: var(--color-primary-dark);
    }
    
    .btn-outline {
      background-color: transparent;
      border: 1px solid var(--color-border);
      color: var(--text-color);
    }
    
    .btn-outline:hover:not(:disabled) {
      border-color: var(--color-primary);
      color: var(--color-primary);
    }
    
    .btn-danger {
      background-color: var(--color-danger);
      color: #fff;
    }
    
    .btn-danger:hover:not(:disabled) {
      background-color: #c0392b;
    }
    
    .btn-sm {
      padding: 0.25rem 0.5rem;
      font-size: 0.875rem;
    }

    .table-container {
      overflow-x: auto;
      overflow-y: visible;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      width: 100%;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: thin;
      scrollbar-color: var(--color-primary) transparent;
    }

    .table-container::-webkit-scrollbar {
      height: 8px;
    }

    .table-container::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4px;
    }

    .table-container::-webkit-scrollbar-thumb {
      background: var(--color-primary);
      border-radius: 4px;
    }

    .table-container::-webkit-scrollbar-thumb:hover {
      background: var(--color-primary-dark);
    }

    .app-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 800px;
      background: #fff;
    }

    .app-table th,
    .app-table td {
      padding: 1rem;
      text-align: right;
      border-bottom: 1px solid var(--border-color);
      white-space: nowrap;
    }

    .app-table th {
      background: #f8f9fa;
      font-weight: 600;
      color: var(--color-primary-dark);
      position: sticky;
      top: 0;
      z-index: 1;
    }

    .app-table tr:hover {
      background: rgba(246, 184, 25, 0.05);
    }

    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--muted-text);
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      margin: 0 0 0.5rem 0;
      color: var(--text-color);
    }

    .empty-state p {
      margin: 0 0 1.5rem 0;
    }

    /* View Modal Styles */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: none; /* hide when not visible to avoid intercepting clicks */
      align-items: center;
      justify-content: center;
      z-index: 1000;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
    }

    .modal-overlay.visible {
      display: flex;
      opacity: 1;
      pointer-events: auto;
    }

    .modal {
      background: #fff;
      border-radius: 12px;
      width: min(800px, 95vw);
      max-height: 90vh;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      transform: scale(0.9);
      transition: transform 0.3s ease;
    }

    .modal.visible {
      transform: scale(1);
    }

    .modal-header {
      background: var(--color-primary-dark);
      color: #fff;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .modal-header button {
      background: transparent;
      border: none;
      color: #fff;
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 4px;
      transition: background 0.2s ease;
    }

    .modal-header button:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .modal-body {
      padding: 2rem;
      max-height: 60vh;
      overflow-y: auto;
    }

    .modal-footer {
      padding: 1.5rem;
      border-top: 1px solid var(--border-color);
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      background: #f8f9fa;
    }

    .user-view-container {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .user-avatar-section {
      text-align: center;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 12px;
    }

    .avatar-large {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: var(--color-primary);
      background-size: cover;
      background-position: center;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: white;
      font-size: 2rem;
      margin: 0 auto 1rem;
      border: 4px solid var(--color-primary);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    }

    .user-avatar-section h2 {
      margin: 0 0 0.5rem 0;
      color: var(--color-primary-dark);
      font-size: 1.5rem;
    }

    .user-role {
      margin: 0;
      color: var(--muted-text);
      font-size: 1rem;
    }

    .info-section {
      background: #fff;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 1.5rem;
    }

    .info-section h4 {
      margin: 0 0 1.5rem 0;
      color: var(--color-primary-dark);
      font-size: 1.1rem;
      font-weight: 600;
      border-bottom: 2px solid var(--color-primary);
      padding-bottom: 0.5rem;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .info-item label {
      font-weight: 600;
      color: var(--text-color);
      font-size: 0.9rem;
    }

    .info-item span {
      color: var(--muted-text);
      font-size: 0.95rem;
    }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 500;
      width: fit-content;
    }

    .status-badge.active {
      background: rgba(40, 167, 69, 0.1);
      color: #28a745;
      border: 1px solid rgba(40, 167, 69, 0.3);
    }

    .status-badge.inactive {
      background: rgba(108, 117, 125, 0.1);
      color: #6c757d;
      border: 1px solid rgba(108, 117, 125, 0.3);
    }

    .documents-view {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
    }

    .document-item {
      text-align: center;
      padding: 1rem;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background: #f8f9fa;
    }

    .document-item h5 {
      margin: 0 0 0.75rem 0;
      font-size: 0.9rem;
      color: var(--color-primary-dark);
      font-weight: 600;
    }

    .document-thumbnail {
      width: 100px;
      height: 100px;
      object-fit: cover;
      border-radius: 8px;
      border: 2px solid var(--border-color);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    @media (max-width: 768px) {
      .modal {
        width: 95vw;
        margin: 1rem;
      }

      .modal-body {
        padding: 1rem;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }

      .documents-view {
        grid-template-columns: repeat(2, 1fr);
      }

      .modal-footer {
        flex-direction: column;
      }
    }

    @media (max-width: 480px) {
      .documents-view {
        grid-template-columns: 1fr;
      }

      .avatar-large {
        width: 100px;
        height: 100px;
        font-size: 1.5rem;
      }
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: stretch;
      }

      .search-section {
        max-width: none;
      }

      .action-buttons {
        flex-direction: column;
        gap: 0.25rem;
      }

      .email {
        min-width: 150px;
      }
    }
  `]
})
export class UsersListComponent implements OnInit {
  users: any[] = [];
  filteredUsers: any[] = [];
  shifts: any[] = [];
  loading = false;
  saving = false;
  error = '';
  searchQuery = '';
  deleteModalVisible = false;
  userToDelete: any = null;
  viewModalVisible = false;
  selectedUser: any = null;

  constructor(
    private sb: SupabaseService,
    private router: Router
  ) {}

  async ngOnInit() {
    await Promise.all([
      this.loadShifts(),
      this.loadUsers()
    ]);
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

  async loadUsers() {
    try {
      this.loading = true;
      this.error = '';
      const { data, error } = await this.sb.rpc('users_get');
      
      if (error) throw error;
      
      this.users = data ?? [];
      this.filteredUsers = [...this.users];
    } catch (error: any) {
      console.error('Error loading users:', error);
      this.error = 'حدث خطأ أثناء تحميل المستخدمين';
    } finally {
      this.loading = false;
    }
  }

  filterUsers() {
    let filtered = [...this.users];

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(user => {
        const fullName = (user.full_name || '').toLowerCase();
        const username = (user.username || '').toLowerCase();
        const nationalNumber = (user.national_number || '').toLowerCase();
        const email = (user.email || '').toLowerCase();
        const phone = (user.phone || '').toLowerCase();
        
        return fullName.includes(query) || 
               username.includes(query) || 
               nationalNumber.includes(query) ||
               email.includes(query) ||
               phone.includes(query);
      });
    }

    this.filteredUsers = filtered;
  }

  clearSearch() {
    this.searchQuery = '';
    this.filteredUsers = [...this.users];
  }

  getInitials(fullName: string): string {
    if (!fullName) return '?';
    const names = fullName.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return fullName[0].toUpperCase();
  }

  getShiftName(shiftId: string): string {
    const shift = this.shifts.find(s => s.id === shiftId);
    return shift ? shift.name : '';
  }

  navigateToNew() {
    console.log('Navigate to new user clicked!');
    this.router.navigate(['/users/new']);
  }

  viewUser(user: any) {
    console.log('View user clicked:', user);
    this.selectedUser = user;
    this.viewModalVisible = true;
  }

  closeViewModal() {
    this.viewModalVisible = false;
    this.selectedUser = null;
  }

  editSelectedUser() {
    if (this.selectedUser) {
      this.router.navigate(['/users/edit', this.selectedUser.id]);
    }
  }

  hasAnyDocument(): boolean {
    if (!this.selectedUser) return false;
    return !!(this.selectedUser.reference_image || 
              this.selectedUser.front_id_image || 
              this.selectedUser.back_id_image || 
              this.selectedUser.feesh_image || 
              this.selectedUser.medical_certificate_image);
  }

  editUser(user: any) {
    console.log('Edit user clicked:', user);
    if (user.id) {
      this.router.navigate(['/users/edit', user.id]);
    }
  }

  deleteUser(user: any) {
    console.log('Delete user clicked:', user);
    if (!user.id) return;
    this.userToDelete = user;
    this.deleteModalVisible = true;
  }

  async confirmDelete() {
    if (!this.userToDelete?.id) return;
    
    try {
      this.saving = true;
      const { error } = await this.sb.rpc('users_delete', { _id: this.userToDelete.id });
      
      if (error) {
        const msg = error.message || '';
        const code = (error as any).code || '';
        if (code === '23503' || /foreign key/i.test(msg) || /violat(es|ed) foreign key/i.test(msg)) {
          this.error = 'تعذر حذف المستخدم لوجود سجلات مرتبطة به. يرجى إزالة الارتباطات أولاً.';
        } else {
          throw error;
        }
        return;
      }
      
      this.users = this.users.filter(u => u.id !== this.userToDelete.id);
      this.filteredUsers = this.filteredUsers.filter(u => u.id !== this.userToDelete.id);
      this.cancelDelete();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      this.error = 'حدث خطأ أثناء حذف المستخدم';
    } finally {
      this.saving = false;
    }
  }

  cancelDelete() {
    this.deleteModalVisible = false;
    this.userToDelete = null;
  }
}
