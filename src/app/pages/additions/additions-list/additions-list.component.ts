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
  selector: 'app-additions-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SpinnerComponent, ButtonComponent, CardComponent, EnhancedSearchComponent],
  template: `
    <div class="page-header">
      <div class="header-content">
        <h1>المكافئات</h1>
        <p class="page-subtitle">إدارة مكافئات الموظفين في النظام</p>
      </div>
      <app-button 
        variant="primary" 
        (btnClick)="navigateToNew()"
        [disabled]="loading">
        <span>➕</span> إضافة مكافأة جديدة
      </app-button>
    </div>

    <!-- Search Bar -->
    <div class="search-bar">
      <div class="search-section">
        <app-enhanced-search
          [(ngModel)]="searchQuery"
          placeholder="البحث في المكافئات بالاسم أو الوصف..."
          (search)="filterAdditions()"
          (clear)="clearSearch()">
        </app-enhanced-search>
      </div>
    </div>

    <!-- Loading State -->
    <app-spinner *ngIf="loading" [overlay]="false" message="جاري تحميل المكافئات..."></app-spinner>

    <!-- Error State -->
    <div *ngIf="error && !loading" class="error-message">
      <span>⚠️</span>
      <p>{{ error }}</p>
      <app-button variant="outline" size="sm" (btnClick)="loadAdditions()">إعادة المحاولة</app-button>
    </div>

    <!-- Additions List -->
    <div *ngIf="!loading && !error" class="additions-list-container">
      <app-card *ngIf="filteredAdditions.length" [title]="'قائمة المكافئات'" [subtitle]="'إجمالي ' + filteredAdditions.length + ' مكافأة'">
        <div class="table-container">
          <table class="app-table">
            <thead>
              <tr>
                <th>المستخدم</th>
                <th>المبلغ</th>
                <th>السبب</th>
                <th>تاريخ المكافأة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let addition of filteredAdditions">
                <td class="user-name">
                  <span class="name-text">{{ getUserName(addition.user_id) }}</span>
                </td>
                <td class="amount">
                  <span class="amount-badge">{{ addition.amount | currency:'EGP':'symbol':'1.2-2':'ar' }}</span>
                </td>
                <td class="reason">
                  <span class="reason-text">{{ addition.reason || '-' }}</span>
                </td>
                <td class="date">
                  <span class="date-badge">{{ addition.created_at | date:'short' }}</span>
                </td>
                <td class="actions">
                  <div class="action-buttons">
                    <app-button 
                      variant="primary" 
                      size="sm" 
                      (btnClick)="viewAddition(addition)"
                      [disabled]="saving">
                      👁️ عرض
                    </app-button>
                    <app-button 
                      variant="outline" 
                      size="sm" 
                      (btnClick)="editAddition(addition)"
                      [disabled]="saving">
                      ✏️ تعديل
                    </app-button>
                    <app-button 
                      variant="danger" 
                      size="sm" 
                      (btnClick)="deleteAddition(addition)"
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
      <div *ngIf="!filteredAdditions.length" class="empty-state">
        <div class="empty-icon">🎁</div>
        <h3>لا توجد مكافئات</h3>
        <p *ngIf="searchQuery">لم يتم العثور على مكافئات تطابق البحث المحدد</p>
        <p *ngIf="!searchQuery">لم يتم إضافة أي مكافئات بعد</p>
        <app-button 
          *ngIf="!searchQuery" 
          variant="primary" 
          (btnClick)="navigateToNew()">
          إضافة أول مكافأة
        </app-button>
      </div>
    </div>

    <!-- View Addition Modal -->
    <div class="modal-overlay" [class.visible]="viewModalVisible" (click)="closeViewModal()">
      <div class="modal" [class.visible]="viewModalVisible" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>عرض بيانات المكافأة</h3>
          <button type="button" (click)="closeViewModal()">×</button>
        </div>
        <div class="modal-body" *ngIf="selectedAddition">
          <div class="info-section">
            <h4>معلومات المكافأة</h4>
            <div class="info-grid">
              <div class="info-item">
                <label>المستخدم:</label>
                <span>{{ getUserName(selectedAddition.user_id) }}</span>
              </div>
              <div class="info-item">
                <label>المبلغ:</label>
                <span class="amount-badge">{{ selectedAddition.amount | currency:'EGP':'symbol':'1.2-2':'ar' }}</span>
              </div>
              <div class="info-item">
                <label>السبب:</label>
                <span>{{ selectedAddition.reason || '-' }}</span>
              </div>
              <div class="info-item">
                <label>تاريخ المكافأة:</label>
                <span class="date-badge">{{ selectedAddition.created_at | date:'short' }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <app-button variant="outline" (btnClick)="closeViewModal()">إغلاق</app-button>
          <app-button variant="primary" (btnClick)="editAddition(selectedAddition)" [disabled]="!selectedAddition">تعديل المكافأة</app-button>
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

    .additions-list-container {
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
      background: rgba(40, 167, 69, 0.1);
      color: #28a745;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.9rem;
      font-weight: 600;
      border: 1px solid rgba(40, 167, 69, 0.3);
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
export class AdditionsListComponent implements OnInit {
  additions: any[] = [];
  filteredAdditions: any[] = [];
  users: any[] = [];
  loading = false;
  saving = false;
  error = '';
  searchQuery = '';
  viewModalVisible = false;
  selectedAddition: any = null;

  constructor(private sb: SupabaseService) {}

  async ngOnInit() {
    await Promise.all([
      this.loadUsers(),
      this.loadAdditions()
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

  async loadAdditions() {
    try {
      this.loading = true;
      this.error = '';
      const { data, error } = await this.sb.rpc('additions_get');
      
      if (error) throw error;
      
      this.additions = data ?? [];
      this.filteredAdditions = [...this.additions];
    } catch (error: any) {
      console.error('Error loading additions:', error);
      this.error = 'حدث خطأ أثناء تحميل المكافئات';
    } finally {
      this.loading = false;
    }
  }

  filterAdditions() {
    let filtered = [...this.additions];

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(addition => {
        const userName = this.getUserName(addition.user_id).toLowerCase();
        const reason = (addition.reason || '').toLowerCase();
        
        return userName.includes(query) || reason.includes(query);
      });
    }

    this.filteredAdditions = filtered;
  }

  clearSearch() {
    this.searchQuery = '';
    this.filteredAdditions = [...this.additions];
  }

  getUserName(userId: string): string {
    const user = this.users.find(u => u.id === userId);
    return user ? (user.full_name || user.username) : userId;
  }

  navigateToNew() {
    window.location.href = '/additions/new';
  }

  editAddition(addition: any) {
    if (addition.id) {
      window.location.href = `/additions/edit/${addition.id}`;
    }
  }

  viewAddition(addition: any) {
    this.selectedAddition = addition;
    this.viewModalVisible = true;
  }

  closeViewModal() {
    this.viewModalVisible = false;
    this.selectedAddition = null;
  }

  async deleteAddition(addition: any) {
    if (!addition.id) return;
    
    const confirmed = confirm(`هل أنت متأكد من حذف المكافأة؟`);
    if (!confirmed) return;
    
    try {
      this.saving = true;
      const { data, error } = await this.sb.rpc('additions_delete', { _id: addition.id });
      
      if (error) {
        const msg = error.message || '';
        const code = (error as any).code || '';
        if (code === '23503' || /foreign key/i.test(msg) || /violat(es|ed) foreign key/i.test(msg)) {
          this.error = 'تعذر حذف المكافأة لوجود سجلات مرتبطة بها. يرجى التحقق من العلاقات المرتبطة أولاً.';
        } else {
          throw error;
        }
        return;
      }
      
      if (data) {
        this.additions = this.additions.filter(a => a.id !== addition.id);
        this.filteredAdditions = this.filteredAdditions.filter(a => a.id !== addition.id);
      } else {
        this.error = 'لم يتم العثور على المكافأة المراد حذفها';
      }
    } catch (error: any) {
      console.error('Error deleting addition:', error);
      this.error = 'حدث خطأ أثناء حذف المكافأة';
    } finally {
      this.saving = false;
    }
  }
}
