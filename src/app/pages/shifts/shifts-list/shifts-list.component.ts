import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/supabase.service';
import { SpinnerComponent } from '../../../core/ui/components/spinner/spinner.component';
import { ButtonComponent } from '../../../core/ui/components/button/button.component';
import { CardComponent } from '../../../core/ui/components/card/card.component';
import { DeleteConfirmationComponent } from '../../../core/ui/components/delete-confirmation/delete-confirmation.component';
import { EnhancedSearchComponent } from '../../../core/ui/components/enhanced-search/enhanced-search.component';

@Component({
  selector: 'app-shifts-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SpinnerComponent, ButtonComponent, CardComponent, DeleteConfirmationComponent, EnhancedSearchComponent],
  template: `
    <div class="page-header">
      <div class="header-content">
        <h1>الورديات</h1>
        <p class="page-subtitle">إدارة ورديات العمل في النظام</p>
      </div>
      <app-button 
        variant="primary" 
        (btnClick)="navigateToNew()"
        [disabled]="loading">
        <span>➕</span> إضافة وردية جديدة
      </app-button>
    </div>

    <!-- Search Bar -->
    <div class="search-bar">
      <div class="search-section">
        <app-enhanced-search
          [(ngModel)]="searchQuery"
          placeholder="البحث في الورديات بالاسم أو الوصف..."
          (search)="filterShifts()"
          (clear)="clearSearch()">
        </app-enhanced-search>
      </div>
    </div>

    <!-- Loading State -->
    <app-spinner *ngIf="loading" [overlay]="false" message="جاري تحميل الورديات..."></app-spinner>

    <!-- Error State -->
    <div *ngIf="error && !loading" class="error-message">
      <span>⚠️</span>
      <p>{{ error }}</p>
      <app-button variant="outline" size="sm" (btnClick)="loadShifts()">إعادة المحاولة</app-button>
    </div>

    <!-- Shifts List -->
    <div *ngIf="!loading && !error" class="shifts-list-container">
      <app-card *ngIf="filteredShifts.length" [title]="'قائمة الورديات'" [subtitle]="'إجمالي ' + filteredShifts.length + ' وردية'">
        <div class="table-container">
          <table class="app-table">
            <thead>
              <tr>
                <th>الاسم</th>
                <th>وقت البداية</th>
                <th>عدد الساعات</th>
                <th>وقت النهاية</th>
                <th>سماح الدخول</th>
                <th>سماح الخروج</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let shift of filteredShifts">
                <td class="shift-name">
                  <span class="name-text">{{ shift.name }}</span>
                </td>
                <td class="start-time">
                  <span class="time-badge">{{ shift.start_time }}</span>
                </td>
                <td class="duration">
                  <span class="duration-text">{{ shift.duration_hours }} ساعة</span>
                </td>
                <td class="end-time">
                  <span class="time-badge">{{ computeEndTime(shift.start_time, shift.duration_hours) }}</span>
                </td>
                <td class="grace-minutes">
                  <span class="grace-badge">{{ shift.checkin_grace_minutes ?? 0 }} دقيقة</span>
                </td>
                <td class="grace-minutes">
                  <span class="grace-badge">{{ shift.checkout_grace_minutes ?? 0 }} دقيقة</span>
                </td>
                <td class="actions">
                  <div class="action-buttons">
                    <app-button 
                      variant="primary" 
                      size="sm" 
                      (btnClick)="viewShift(shift)"
                      [disabled]="saving">
                      👁️ عرض
                    </app-button>
                    <app-button 
                      variant="outline" 
                      size="sm" 
                      (btnClick)="editShift(shift)"
                      [disabled]="saving">
                      ✏️ تعديل
                    </app-button>
                    <app-button 
                      variant="danger" 
                      size="sm" 
                      (btnClick)="deleteShift(shift)"
                      [disabled]="saving">
                      🗑️ حذف
                    </app-button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </app-card>

      <!-- Empty State -->
      <div *ngIf="!filteredShifts.length" class="empty-state">
        <div class="empty-icon">⏰</div>
        <h3>لا توجد ورديات</h3>
        <p *ngIf="searchQuery">لم يتم العثور على ورديات تطابق البحث المحدد</p>
        <p *ngIf="!searchQuery">لم يتم إضافة أي ورديات بعد</p>
        <app-button 
          *ngIf="!searchQuery" 
          variant="primary" 
          (btnClick)="navigateToNew()">
          إضافة أول وردية
        </app-button>
      </div>
    </div>

    <!-- View Shift Modal -->
    <div class="modal-overlay" [class.visible]="viewModalVisible" (click)="closeViewModal()">
      <div class="modal" [class.visible]="viewModalVisible" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>عرض بيانات الوردية</h3>
          <button type="button" (click)="closeViewModal()">×</button>
        </div>
        <div class="modal-body" *ngIf="selectedShift">
          <div class="info-section">
            <h4>معلومات الوردية</h4>
            <div class="info-grid">
              <div class="info-item">
                <label>الاسم:</label>
                <span>{{ selectedShift.name }}</span>
              </div>
              <div class="info-item">
                <label>وقت البداية:</label>
                <span class="time-badge">{{ selectedShift.start_time }}</span>
              </div>
              <div class="info-item">
                <label>عدد الساعات:</label>
                <span>{{ selectedShift.duration_hours }} ساعة</span>
              </div>
              <div class="info-item">
                <label>وقت النهاية:</label>
                <span class="time-badge">{{ computeEndTime(selectedShift.start_time, selectedShift.duration_hours) }}</span>
              </div>
              <div class="info-item">
                <label>سماح الدخول:</label>
                <span>{{ selectedShift.checkin_grace_minutes ?? 0 }} دقيقة</span>
              </div>
              <div class="info-item">
                <label>سماح الخروج:</label>
                <span>{{ selectedShift.checkout_grace_minutes ?? 0 }} دقيقة</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <app-button variant="outline" (btnClick)="closeViewModal()">إغلاق</app-button>
          <app-button variant="primary" (btnClick)="editShift(selectedShift)" [disabled]="!selectedShift">تعديل الوردية</app-button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <app-delete-confirmation
      [visible]="deleteModalVisible"
      [title]="'حذف الوردية'"
      [message]="'هل أنت متأكد من أنك تريد حذف هذه الوردية؟'"
      [itemName]="shiftToDelete?.name"
      [loading]="saving"
      (confirm)="confirmDelete()"
      (cancel)="cancelDelete()">
    </app-delete-confirmation>

    <!-- Users Assignment Modal -->
    <div *ngIf="showUsersModal" class="users-modal-overlay" (click)="closeUsersModal()">
      <div class="users-modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>المستخدمون المرتبطون بالوردية</h3>
          <button class="close-btn" (click)="closeUsersModal()">×</button>
        </div>
        
        <div class="modal-body">
          <p class="modal-description">
            لا يمكن حذف الوردية "<strong>{{ shiftToDelete?.name }}</strong>" لأنها مرتبطة بالمستخدمين التاليين. 
            يرجى تغيير وردياتهم أو إزالة الوردية منهم أولاً.
          </p>
          
          <div class="users-list">
            <div *ngFor="let user of usersWithThisShift" class="user-item">
              <div class="user-info">
                <span class="user-name">{{ user.full_name || user.username }}</span>
                <span class="user-email">{{ user.email }}</span>
              </div>
              
              <div class="shift-selector">
                <label>الوردية:</label>
                <select 
                  [value]="user.shift_id || 'null'" 
                  (change)="onShiftChange(user, $event)"
                  [disabled]="updatingUserShifts">
                  <option value="null">بدون وردية</option>
                  <option *ngFor="let shift of getAssignableShifts()" [value]="shift.id">
                    {{ shift.name }}
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <app-button 
            variant="outline" 
            (btnClick)="closeUsersModal()"
            [disabled]="updatingUserShifts">
            إلغاء
          </app-button>
          
          <app-button 
            variant="primary" 
            (btnClick)="proceedWithDeletion()"
            [disabled]="usersWithThisShift.length > 0 || updatingUserShifts">
            <span *ngIf="updatingUserShifts">⏳</span>
            <span *ngIf="!updatingUserShifts">حذف الوردية</span>
          </app-button>
        </div>
      </div>
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

    .shifts-list-container {
      margin-top: 1rem;
    }

    .shift-name {
      min-width: 150px;
    }

    .name-text {
      font-weight: 600;
      color: var(--text-color);
    }

    .start-time, .end-time {
      width: 100px;
    }

    .time-badge {
      display: inline-block;
      background: var(--color-primary);
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 600;
      font-family: monospace;
    }

    .duration {
      width: 100px;
    }

    .duration-text {
      font-weight: 500;
      color: var(--text-color);
    }

    .grace-minutes {
      width: 100px;
    }

    .grace-badge {
      display: inline-block;
      background: #f8f9fa;
      color: var(--text-color);
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 500;
      border: 1px solid var(--border-color);
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
      justify-content: center;
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
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
    }

    .modal-overlay.visible { display: flex; opacity: 1; pointer-events: auto; }

    .modal {
      background: #fff;
      border-radius: 12px;
      width: min(700px, 95vw);
      max-height: 90vh;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      transform: scale(0.9);
      transition: transform 0.3s ease;
    }

    .modal.visible { transform: scale(1); }

    .modal-header {
      background: var(--color-primary-dark);
      color: #fff;
      padding: 1.25rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .modal-header h3 { margin: 0; font-size: 1.1rem; font-weight: 600; }

    .modal-header button {
      background: transparent; border: none; color: #fff; font-size: 1.5rem; cursor: pointer;
      padding: 0.25rem; border-radius: 4px; transition: background 0.2s ease;
    }

    .modal-header button:hover { background: rgba(255, 255, 255, 0.1); }

    .modal-body { padding: 1.5rem; max-height: 60vh; overflow-y: auto; }

    .modal-footer {
      padding: 1rem 1.5rem; border-top: 1px solid var(--border-color); display: flex; gap: 0.75rem; justify-content: flex-end; background: #f8f9fa;
    }

    .info-section { background: #fff; border: 1px solid var(--border-color); border-radius: 8px; padding: 1rem; }
    .info-section h4 { margin: 0 0 1rem 0; color: var(--color-primary-dark); font-size: 1rem; font-weight: 600; border-bottom: 2px solid var(--color-primary); padding-bottom: 0.5rem; }
    .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .info-item { display: flex; flex-direction: column; gap: 0.25rem; }
    .info-item label { font-weight: 600; color: var(--text-color); font-size: 0.9rem; }
    .info-item span { color: var(--muted-text); font-size: 0.95rem; }

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

      .info-grid { grid-template-columns: 1fr; }
    }

    /* Users Modal Styles */
    .users-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      width: 100vw;
      height: 100vh;
    }

    .users-modal-content {
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      max-width: 700px;
      width: 90%;
      max-height: 80vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
      z-index: 10001;
    }

    .modal-header {
      padding: 1.5rem;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h3 {
      margin: 0;
      color: var(--color-primary-dark);
      font-size: 1.5rem;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #666;
      padding: 0.25rem;
      line-height: 1;
    }

    .close-btn:hover {
      color: #333;
    }

    .modal-body {
      padding: 1.5rem;
      flex: 1;
      overflow-y: auto;
    }

    .modal-description {
      margin: 0 0 1.5rem 0;
      color: #666;
      line-height: 1.5;
    }

    .users-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .user-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .user-name {
      font-weight: 600;
      color: #333;
    }

    .user-email {
      font-size: 0.9rem;
      color: #666;
    }

    .shift-selector {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .shift-selector label {
      font-weight: 500;
      color: #555;
      white-space: nowrap;
    }

    .shift-selector select {
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 6px;
      background: white;
      min-width: 200px;
    }

    .shift-selector select:disabled {
      background: #f5f5f5;
      color: #999;
    }

    .modal-footer {
      padding: 1.5rem;
      border-top: 1px solid #e0e0e0;
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
    }
  `]
})
export class ShiftsListComponent implements OnInit {
  shifts: any[] = [];
  filteredShifts: any[] = [];
  loading = false;
  saving = false;
  error = '';
  searchQuery = '';
  deleteModalVisible = false;
  shiftToDelete: any = null;
  viewModalVisible = false;
  selectedShift: any = null;
  usersWithThisShift: any[] = [];
  showUsersModal = false;
  allShifts: any[] = [];
  updatingUserShifts = false;
  showError = false;

  constructor(private sb: SupabaseService) {}

  async ngOnInit() {
    await this.loadShifts();
  }

  async loadShifts() {
    try {
      this.loading = true;
      this.error = '';
      const { data, error } = await this.sb.rpc('shifts_get');
      
      if (error) throw error;
      
      this.shifts = data ?? [];
      this.filteredShifts = [...this.shifts];
      this.allShifts = [...this.shifts];
    } catch (error: any) {
      console.error('Error loading shifts:', error);
      this.error = 'حدث خطأ أثناء تحميل الورديات';
    } finally {
      this.loading = false;
    }
  }

  filterShifts() {
    let filtered = [...this.shifts];

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(shift => 
        shift.name?.toLowerCase().includes(query) ||
        shift.start_time?.includes(query) ||
        shift.end_time?.includes(query) ||
        shift.description?.toLowerCase().includes(query)
      );
    }

    this.filteredShifts = filtered;
  }

  clearSearch() {
    this.searchQuery = '';
    this.filteredShifts = [...this.shifts];
  }

  navigateToNew() {
    window.location.href = '/shifts/new';
  }

  editShift(shift: any) {
    if (shift.id) {
      window.location.href = `/shifts/edit/${shift.id}`;
    }
  }

  viewShift(shift: any) {
    this.selectedShift = shift;
    this.viewModalVisible = true;
  }

  closeViewModal() {
    this.viewModalVisible = false;
    this.selectedShift = null;
  }

  deleteShift(shift: any) {
    if (!shift.id) return;
    this.shiftToDelete = shift;
    this.deleteModalVisible = true;
  }

  async confirmDelete() {
    if (!this.shiftToDelete?.id) return;
    
    try {
      this.saving = true;
      
      // First check if there are users assigned to this shift
      const { data: usersData } = await this.sb.rpc('users_get');
      const usersWithThisShift = (usersData || []).filter((user: any) => user.shift_id === this.shiftToDelete.id);
      
      console.log('Shift to delete:', this.shiftToDelete);
      console.log('All users:', usersData);
      console.log('Users with this shift:', usersWithThisShift);
      
      if (usersWithThisShift.length > 0) {
        this.usersWithThisShift = usersWithThisShift;
        this.saving = false; // Reset saving state first
        this.deleteModalVisible = false; // Close delete modal first
        // Store shift info before clearing
        const shiftToDelete = { ...this.shiftToDelete };
        this.shiftToDelete = null; // Clear the shift to delete
        // Use setTimeout to ensure the delete modal closes before showing users modal
        setTimeout(() => {
          this.shiftToDelete = shiftToDelete; // Restore shift info for users modal
          this.showUsersModal = true;
          console.log('Showing users modal after timeout');
        }, 200);
        return;
      }
      
      const { data, error } = await this.sb.rpc('shifts_delete', { _id: this.shiftToDelete.id });
      
      if (error) {
        const msg = error.message || '';
        const code = (error as any).code || '';
        if (code === '23503' || /foreign key/i.test(msg) || /violat(es|ed) foreign key/i.test(msg)) {
          this.error = 'لا يمكن حذف الوردية لأنها مرتبطة بمستخدمين. الرجاء تعديل المستخدمين أولاً أو إزالة الوردية من المستخدمين.';
          this.showError = true;
          setTimeout(() => this.showError = false, 5000);
        } else {
          throw error;
        }
        return;
      }
      
      if (data) {
        this.shifts = this.shifts.filter(s => s.id !== this.shiftToDelete.id);
        this.filteredShifts = this.filteredShifts.filter(s => s.id !== this.shiftToDelete.id);
        this.cancelDelete();
      } else {
        this.error = 'لم يتم العثور على الوردية المراد حذفها';
      }
    } catch (error: any) {
      console.error('Error deleting shift:', error);
      this.error = 'حدث خطأ أثناء حذف الوردية';
    } finally {
      this.saving = false;
    }
  }

  cancelDelete() {
    this.deleteModalVisible = false;
    this.shiftToDelete = null;
  }

  closeUsersModal() {
    this.showUsersModal = false;
    this.usersWithThisShift = [];
  }

  onShiftChange(user: any, event: Event) {
    const target = event.target as HTMLSelectElement;
    if (target) {
      this.updateUserShift(user, target.value);
    }
  }

  async updateUserShift(user: any, newShiftId: string) {
    try {
      this.updatingUserShifts = true;
      const { error } = await this.sb.rpc('users_update', {
        _id: user.id,
        _shift_id: newShiftId === 'null' ? null : newShiftId
      });
      
      if (error) throw error;
      
      // Update the user in the local array
      user.shift_id = newShiftId === 'null' ? null : newShiftId;
      
      // Remove user from the list if they no longer have this shift
      if (user.shift_id !== this.shiftToDelete.id) {
        this.usersWithThisShift = this.usersWithThisShift.filter(u => u.id !== user.id);
      }
      
    } catch (error: any) {
      console.error('Error updating user shift:', error);
      this.error = 'فشل تحديث وردية المستخدم';
    } finally {
      this.updatingUserShifts = false;
    }
  }

  async proceedWithDeletion() {
    if (this.usersWithThisShift.length === 0) {
      this.closeUsersModal();
      await this.performDeletion();
    }
  }

  async performDeletion() {
    if (!this.shiftToDelete?.id) return;
    
    try {
      this.saving = true;
      const { data, error } = await this.sb.rpc('shifts_delete', { _id: this.shiftToDelete.id });
      
      if (error) {
        const msg = error.message || '';
        const code = (error as any).code || '';
        if (code === '23503' || /foreign key/i.test(msg) || /violat(es|ed) foreign key/i.test(msg)) {
          this.error = 'لا يمكن حذف الوردية لأنها مرتبطة بمستخدمين. الرجاء تعديل المستخدمين أولاً أو إزالة الوردية من المستخدمين.';
          this.showError = true;
          setTimeout(() => this.showError = false, 5000);
        } else {
          throw error;
        }
        return;
      }
      
      if (data) {
        this.shifts = this.shifts.filter(s => s.id !== this.shiftToDelete.id);
        this.filteredShifts = this.filteredShifts.filter(s => s.id !== this.shiftToDelete.id);
        this.cancelDelete();
      } else {
        this.error = 'لم يتم العثور على الوردية المراد حذفها';
      }
    } catch (error: any) {
      this.error = error?.message ?? 'فشل حذف الوردية';
    } finally {
      this.saving = false;
    }
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

  // Returns all shifts except the one being deleted (to prevent reassigning to the same shift)
  getAssignableShifts() {
    const deleteId = this.shiftToDelete?.id;
    if (!deleteId) return this.allShifts;
    return this.allShifts.filter(s => s.id !== deleteId);
  }
}
