import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/supabase.service';
import { SpinnerComponent } from '../../../core/ui/components/spinner/spinner.component';
import { ButtonComponent } from '../../../core/ui/components/button/button.component';
import { CardComponent } from '../../../core/ui/components/card/card.component';
import { EnhancedSearchComponent } from '../../../core/ui/components/enhanced-search/enhanced-search.component';

@Component({
  selector: 'app-deductions-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SpinnerComponent, ButtonComponent, CardComponent, EnhancedSearchComponent],
  template: `
    <div class="page-header">
      <div class="header-content">
        <h1>الخصومات</h1>
        <p class="page-subtitle">إدارة خصومات الموظفين في النظام</p>
      </div>
      <app-button 
        variant="primary" 
        (btnClick)="navigateToNew()"
        [disabled]="loading">
        <span>➕</span> إضافة خصم جديد
      </app-button>
    </div>

    <!-- Search Bar -->
    <div class="search-bar">
      <div class="search-section">
        <app-enhanced-search
          [(ngModel)]="searchQuery"
          placeholder="البحث في الخصومات بالاسم أو الوصف..."
          (search)="filterDeductions()"
          (clear)="clearSearch()">
        </app-enhanced-search>
      </div>
    </div>

    <!-- Loading State -->
    <app-spinner *ngIf="loading" [overlay]="false" message="جاري تحميل الخصومات..."></app-spinner>

    <!-- Error State -->
    <div *ngIf="error && !loading" class="error-message">
      <span>⚠️</span>
      <p>{{ error }}</p>
      <app-button variant="outline" size="sm" (btnClick)="loadDeductions()">إعادة المحاولة</app-button>
    </div>

    <!-- Deductions List -->
    <div *ngIf="!loading && !error" class="deductions-list-container">
      <app-card *ngIf="filteredDeductions.length" [title]="'قائمة الخصومات'" [subtitle]="'إجمالي ' + filteredDeductions.length + ' خصم'">
        <div class="table-container">
          <table class="app-table">
            <thead>
              <tr>
                <th>المستخدم</th>
                <th>المبلغ</th>
                <th>السبب</th>
                <th>تاريخ الخصم</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let deduction of filteredDeductions">
                <td class="user-name">
                  <span class="name-text">{{ getUserName(deduction.user_id) }}</span>
                </td>
                <td class="amount">
                  <span class="amount-badge">{{ deduction.amount | currency:'EGP':'symbol':'1.2-2':'ar' }}</span>
                </td>
                <td class="reason">
                  <span class="reason-text">{{ deduction.reason || '-' }}</span>
                </td>
                <td class="date">
                  <span class="date-badge">{{ deduction.created_at | date:'short' }}</span>
                </td>
                <td class="actions">
                  <div class="action-buttons">
                    <app-button 
                      variant="primary" 
                      size="sm" 
                      (btnClick)="viewDeduction(deduction)"
                      [disabled]="saving">
                      👁️ عرض
                    </app-button>
                    <app-button 
                      variant="outline" 
                      size="sm" 
                      (btnClick)="editDeduction(deduction)"
                      [disabled]="saving">
                      ✏️ تعديل
                    </app-button>
                    <app-button 
                      variant="danger" 
                      size="sm" 
                      (btnClick)="deleteDeduction(deduction)"
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
      <div *ngIf="!filteredDeductions.length" class="empty-state">
        <div class="empty-icon">💰</div>
        <h3>لا توجد خصومات</h3>
        <p *ngIf="searchQuery">لم يتم العثور على خصومات تطابق البحث المحدد</p>
        <p *ngIf="!searchQuery">لم يتم إضافة أي خصومات بعد</p>
        <app-button 
          *ngIf="!searchQuery" 
          variant="primary" 
          (btnClick)="navigateToNew()">
          إضافة أول خصم
        </app-button>
      </div>
    </div>

    <!-- View Deduction Modal -->
    <div class="modal-overlay" [class.visible]="viewModalVisible" (click)="closeViewModal()">
      <div class="modal" [class.visible]="viewModalVisible" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>عرض بيانات الخصم</h3>
          <button type="button" (click)="closeViewModal()">×</button>
        </div>
        <div class="modal-body" *ngIf="selectedDeduction">
          <div class="info-section">
            <h4>معلومات الخصم</h4>
            <div class="info-grid">
              <div class="info-item">
                <label>المستخدم:</label>
                <span>{{ getUserName(selectedDeduction.user_id) }}</span>
              </div>
              <div class="info-item">
                <label>المبلغ:</label>
                <span class="amount-badge">{{ selectedDeduction.amount | currency:'EGP':'symbol':'1.2-2':'ar' }}</span>
              </div>
              <div class="info-item">
                <label>السبب:</label>
                <span>{{ selectedDeduction.reason || '-' }}</span>
              </div>
              <div class="info-item">
                <label>تاريخ الخصم:</label>
                <span class="date-badge">{{ selectedDeduction.created_at | date:'short' }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <app-button variant="outline" (btnClick)="closeViewModal()">إغلاق</app-button>
          <app-button variant="primary" (btnClick)="editDeduction(selectedDeduction)" [disabled]="!selectedDeduction">تعديل الخصم</app-button>
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

    .deductions-list-container {
      margin-top: 1rem;
    }

    .user-name {
      min-width: 150px;
    }

    .name-text {
      font-weight: 600;
      color: var(--text-color);
    }

    .amount {
      width: 120px;
    }

    .amount-badge {
      display: inline-block;
      background: rgba(220, 53, 69, 0.1);
      color: #dc3545;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.9rem;
      font-weight: 600;
      border: 1px solid rgba(220, 53, 69, 0.3);
    }

    .reason {
      min-width: 200px;
      max-width: 400px;
    }

    .reason-text {
      color: var(--text-color);
      word-break: break-word;
    }

    .date {
      width: 140px;
    }

    .date-badge {
      display: inline-block;
      background: #f8f9fa;
      color: var(--text-color);
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 500;
      font-family: monospace;
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
    .modal { background: #fff; border-radius: 12px; width: min(700px, 95vw); max-height: 90vh; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3); transform: scale(0.9); transition: transform 0.3s ease; }
    .modal.visible { transform: scale(1); }
    .modal-header { background: var(--color-primary-dark); color: #fff; padding: 1.25rem 1.5rem; display: flex; align-items: center; justify-content: space-between; }
    .modal-header h3 { margin: 0; font-size: 1.1rem; font-weight: 600; }
    .modal-header button { background: transparent; border: none; color: #fff; font-size: 1.5rem; cursor: pointer; padding: 0.25rem; border-radius: 4px; transition: background 0.2s ease; }
    .modal-header button:hover { background: rgba(255,255,255,0.1); }
    .modal-body { padding: 1.5rem; max-height: 60vh; overflow-y: auto; }
    .modal-footer { padding: 1rem 1.5rem; border-top: 1px solid var(--border-color); display: flex; gap: 0.75rem; justify-content: flex-end; background: #f8f9fa; }
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

      .reason {
        max-width: 200px;
      }

      .info-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class DeductionsListComponent implements OnInit {
  deductions: any[] = [];
  filteredDeductions: any[] = [];
  users: any[] = [];
  loading = false;
  saving = false;
  error = '';
  searchQuery = '';
  viewModalVisible = false;
  selectedDeduction: any = null;

  constructor(private sb: SupabaseService) {}

  async ngOnInit() {
    await Promise.all([
      this.loadUsers(),
      this.loadDeductions()
    ]);
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

  async loadDeductions() {
    try {
      this.loading = true;
      this.error = '';
      const { data, error } = await this.sb.rpc('deductions_get');
      
      if (error) throw error;
      
      this.deductions = data ?? [];
      this.filteredDeductions = [...this.deductions];
    } catch (error: any) {
      console.error('Error loading deductions:', error);
      this.error = 'حدث خطأ أثناء تحميل الخصومات';
    } finally {
      this.loading = false;
    }
  }

  filterDeductions() {
    let filtered = [...this.deductions];

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(deduction => {
        const userName = this.getUserName(deduction.user_id).toLowerCase();
        const reason = (deduction.reason || '').toLowerCase();
        
        return userName.includes(query) || reason.includes(query);
      });
    }

    this.filteredDeductions = filtered;
  }

  clearSearch() {
    this.searchQuery = '';
    this.filteredDeductions = [...this.deductions];
  }

  getUserName(userId: string): string {
    const user = this.users.find(u => u.id === userId);
    return user ? (user.full_name || user.username) : userId;
  }

  navigateToNew() {
    window.location.href = '/deductions/new';
  }

  editDeduction(deduction: any) {
    if (deduction.id) {
      window.location.href = `/deductions/edit/${deduction.id}`;
    }
  }

  viewDeduction(deduction: any) {
    this.selectedDeduction = deduction;
    this.viewModalVisible = true;
  }

  closeViewModal() {
    this.viewModalVisible = false;
    this.selectedDeduction = null;
  }

  async deleteDeduction(deduction: any) {
    if (!deduction.id) return;
    
    const confirmed = confirm(`هل أنت متأكد من حذف الخصم؟`);
    if (!confirmed) return;
    
    try {
      this.saving = true;
      const { data, error } = await this.sb.rpc('deductions_delete', { _id: deduction.id });
      
      if (error) {
        const msg = error.message || '';
        const code = (error as any).code || '';
        if (code === '23503' || /foreign key/i.test(msg) || /violat(es|ed) foreign key/i.test(msg)) {
          this.error = 'تعذر حذف الخصم لوجود سجلات مرتبطة به. يرجى التحقق من العلاقات المرتبطة أولاً.';
        } else {
          throw error;
        }
        return;
      }
      
      if (data) {
        this.deductions = this.deductions.filter(d => d.id !== deduction.id);
        this.filteredDeductions = this.filteredDeductions.filter(d => d.id !== deduction.id);
      } else {
        this.error = 'لم يتم العثور على الخصم المراد حذفه';
      }
    } catch (error: any) {
      console.error('Error deleting deduction:', error);
      this.error = 'حدث خطأ أثناء حذف الخصم';
    } finally {
      this.saving = false;
    }
  }
}
