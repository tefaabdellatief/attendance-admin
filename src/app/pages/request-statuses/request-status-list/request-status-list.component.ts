import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RequestStatus, RequestStatusService } from '../../../core/services/request-status.service';
import { SpinnerComponent } from '../../../core/ui/components/spinner/spinner.component';
import { ButtonComponent } from '../../../core/ui/components/button/button.component';
import { CardComponent } from '../../../core/ui/components/card/card.component';
import { EnhancedSearchComponent } from '../../../core/ui/components/enhanced-search/enhanced-search.component';

@Component({
  selector: 'app-request-status-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SpinnerComponent, ButtonComponent, CardComponent, EnhancedSearchComponent],
  template: `
    <div class="page-header">
      <div class="header-content">
      <h1>حالات الطلبات</h1>
        <p class="page-subtitle">إدارة حالات الطلبات في النظام</p>
      </div>
      <app-button 
        variant="primary" 
        (btnClick)="navigateToNew()"
        [disabled]="loading">
        <span>➕</span> إضافة حالة جديدة
      </app-button>
    </div>

    <!-- Search Bar -->
    <div class="search-bar">
      <div class="search-section">
        <app-enhanced-search
          [(ngModel)]="searchQuery"
          placeholder="البحث في حالات الطلبات بالاسم أو الوصف..."
          (search)="filterStatuses()"
          (clear)="clearSearch()">
        </app-enhanced-search>
      </div>
    </div>

    <!-- Loading State -->
    <app-spinner *ngIf="loading" [overlay]="false" message="جاري تحميل حالات الطلبات..."></app-spinner>

    <!-- Error State -->
    <div *ngIf="error && !loading" class="error-message">
      <span>⚠️</span>
      <p>{{ error }}</p>
      <app-button variant="outline" size="sm" (btnClick)="loadStatuses()">إعادة المحاولة</app-button>
    </div>

    <!-- Status List -->
    <div *ngIf="!loading && !error" class="status-list-container">
      <app-card *ngIf="filteredStatuses.length" [title]="'قائمة حالات الطلبات'" [subtitle]="'إجمالي ' + filteredStatuses.length + ' حالة'">
        <div class="table-container">
          <table class="app-table">
            <thead>
              <tr>
                <th>الكود</th>
                <th>الاسم</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
        <tbody>
              <tr *ngFor="let status of filteredStatuses">
                <td class="status-code">
                  <span class="code-badge">{{ status.code }}</span>
                </td>
                <td class="status-name">
                  <span class="name-text">{{ status.name_ar }}</span>
                </td>
                <td class="actions">
                  <div class="action-buttons">
                    <app-button 
                      variant="primary" 
                      size="sm" 
                      (btnClick)="viewStatus(status)"
                      [disabled]="saving">
                      👁️ عرض
                    </app-button>
                    <app-button 
                      variant="outline" 
                      size="sm" 
                      (btnClick)="editStatus(status)"
                      [disabled]="saving">
                      ✏️ تعديل
                    </app-button>
                    <app-button 
                      variant="danger" 
                      size="sm" 
                      (btnClick)="deleteStatus(status)"
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
      <div *ngIf="!filteredStatuses.length" class="empty-state">
        <div class="empty-icon">🏷️</div>
        <h3>لا توجد حالات طلبات</h3>
        <p *ngIf="searchQuery">لم يتم العثور على حالات تطابق البحث المحدد</p>
        <p *ngIf="!searchQuery">لم يتم إضافة أي حالات طلبات بعد</p>
        <app-button 
          *ngIf="!searchQuery" 
          variant="primary" 
          (btnClick)="navigateToNew()">
          إضافة أول حالة
        </app-button>
      </div>
    </div>

    <!-- View Request Status Modal -->
    <div class="modal-overlay" [class.visible]="viewModalVisible" (click)="closeViewModal()">
      <div class="modal" [class.visible]="viewModalVisible" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>عرض حالة الطلب</h3>
          <button type="button" (click)="closeViewModal()">×</button>
        </div>
        <div class="modal-body" *ngIf="selectedStatus">
          <div class="info-section">
            <h4>معلومات الحالة</h4>
            <div class="info-grid">
              <div class="info-item">
                <label>الكود:</label>
                <span class="code-badge">{{ selectedStatus.code }}</span>
              </div>
              <div class="info-item">
                <label>الاسم:</label>
                <span>{{ selectedStatus.name_ar }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <app-button variant="outline" (btnClick)="closeViewModal()">إغلاق</app-button>
          <app-button variant="primary" (btnClick)="selectedStatus && editStatus(selectedStatus)" [disabled]="!selectedStatus">تعديل الحالة</app-button>
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

    .status-list-container {
      margin-top: 1rem;
    }

    .status-code {
      width: 100px;
    }

    .code-badge {
      display: inline-block;
      background: var(--color-primary);
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 600;
      font-family: monospace;
    }

    .status-name {
      min-width: 200px;
    }

    .name-text {
      font-weight: 600;
      color: var(--text-color);
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
    .modal { background: #fff; border-radius: 12px; width: min(600px, 95vw); max-height: 90vh; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3); transform: scale(0.9); transition: transform 0.3s ease; }
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

      .info-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class RequestStatusListComponent implements OnInit {
  statuses: RequestStatus[] = [];
  filteredStatuses: RequestStatus[] = [];
  loading = false;
  saving = false;
  error = '';
  searchQuery = '';
  viewModalVisible = false;
  selectedStatus: RequestStatus | null = null;

  constructor(private requestStatusService: RequestStatusService) {}

  async ngOnInit() {
    await this.loadStatuses();
  }

  async loadStatuses() {
    try {
      this.loading = true;
      this.error = '';
      this.statuses = await this.requestStatusService.getAll();
      this.filteredStatuses = [...this.statuses];
    } catch (error: any) {
      console.error('Error loading statuses:', error);
      this.error = 'حدث خطأ أثناء تحميل حالات الطلبات';
    } finally {
      this.loading = false;
    }
  }

  filterStatuses() {
    let filtered = [...this.statuses];

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(status => 
        status.name_ar?.toLowerCase().includes(query) ||
        status.code?.toLowerCase().includes(query)
      );
    }

    this.filteredStatuses = filtered;
  }

  clearSearch() {
    this.searchQuery = '';
    this.filteredStatuses = [...this.statuses];
  }

  navigateToNew() {
    // This will be handled by router navigation
    window.location.href = '/request-statuses/new';
  }

  editStatus(status: RequestStatus) {
    if (status.id) {
      window.location.href = `/request-statuses/edit/${status.id}`;
    }
  }

  viewStatus(status: RequestStatus) {
    this.selectedStatus = status;
    this.viewModalVisible = true;
  }

  closeViewModal() {
    this.viewModalVisible = false;
    this.selectedStatus = null;
  }

  async deleteStatus(status: RequestStatus) {
    if (!status.id) return;
    
    const confirmed = confirm(`هل أنت متأكد من حذف الحالة "${status.name_ar}"؟`);
    if (!confirmed) return;
    
    try {
      this.saving = true;
      await this.requestStatusService.delete(status.id);
      this.statuses = this.statuses.filter(s => s.id !== status.id);
      this.filteredStatuses = this.filteredStatuses.filter(s => s.id !== status.id);
    } catch (error: any) {
      console.error('Error deleting status:', error);
      this.error = 'حدث خطأ أثناء حذف الحالة';
    } finally {
      this.saving = false;
    }
  }

}
