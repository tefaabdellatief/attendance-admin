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
  selector: 'app-attendance-types-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SpinnerComponent, ButtonComponent, CardComponent, EnhancedSearchComponent],
  template: `
    <div class="page-header">
      <div class="header-content">
        <h1>أنواع الحضور</h1>
        <p class="page-subtitle">إدارة أنواع الحضور والانصراف في النظام</p>
      </div>
      <app-button 
        variant="primary" 
        (btnClick)="navigateToNew()"
        [disabled]="loading">
        <span>➕</span> إضافة نوع جديد
      </app-button>
    </div>

    <!-- Search Bar -->
    <div class="search-bar">
      <div class="search-section">
        <app-enhanced-search
          [(ngModel)]="searchQuery"
          placeholder="البحث في أنواع الحضور بالاسم أو الوصف..."
          (search)="filterTypes()"
          (clear)="clearSearch()">
        </app-enhanced-search>
      </div>
    </div>

    <!-- Loading State -->
    <app-spinner *ngIf="loading" [overlay]="false" message="جاري تحميل أنواع الحضور..."></app-spinner>

    <!-- Error State -->
    <div *ngIf="error && !loading" class="error-message">
      <span>⚠️</span>
      <p>{{ error }}</p>
      <app-button variant="outline" size="sm" (btnClick)="loadTypes()">إعادة المحاولة</app-button>
    </div>

    <!-- Types List -->
    <div *ngIf="!loading && !error" class="types-list-container">
      <app-card *ngIf="filteredTypes.length" [title]="'قائمة أنواع الحضور'" [subtitle]="'إجمالي ' + filteredTypes.length + ' نوع'">
        <div class="table-container">
          <table class="app-table">
            <thead>
              <tr>
                <th>الاسم</th>
                <th>الوصف</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let type of filteredTypes">
                <td class="type-name">
                  <span class="name-text">{{ type.name }}</span>
                </td>
                <td class="type-description">
                  <span class="description-text">{{ type.description || '-' }}</span>
                </td>
                <td class="actions">
                  <div class="action-buttons">
                    <app-button 
                      variant="primary" 
                      size="sm" 
                      (btnClick)="viewType(type)"
                      [disabled]="saving">
                      👁️ عرض
                    </app-button>
                    <app-button 
                      variant="outline" 
                      size="sm" 
                      (btnClick)="editType(type)"
                      [disabled]="saving">
                      ✏️ تعديل
                    </app-button>
                    <app-button 
                      variant="danger" 
                      size="sm" 
                      (btnClick)="deleteType(type)"
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
      <div *ngIf="!filteredTypes.length" class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>لا توجد أنواع حضور</h3>
        <p *ngIf="searchQuery">لم يتم العثور على أنواع تطابق البحث المحدد</p>
        <p *ngIf="!searchQuery">لم يتم إضافة أي أنواع حضور بعد</p>
        <app-button 
          *ngIf="!searchQuery" 
          variant="primary" 
          (btnClick)="navigateToNew()">
          إضافة أول نوع
        </app-button>
      </div>
    </div>

    <!-- View Type Modal -->
    <div class="modal-overlay" [class.visible]="viewModalVisible" (click)="closeViewModal()">
      <div class="modal" [class.visible]="viewModalVisible" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>عرض نوع الحضور</h3>
          <button type="button" (click)="closeViewModal()">×</button>
        </div>
        <div class="modal-body" *ngIf="selectedType">
          <div class="info-section">
            <h4>معلومات النوع</h4>
            <div class="info-grid">
              <div class="info-item">
                <label>الاسم:</label>
                <span>{{ selectedType.name }}</span>
              </div>
              <div class="info-item">
                <label>الوصف:</label>
                <span>{{ selectedType.description || '-' }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <app-button variant="outline" (btnClick)="closeViewModal()">إغلاق</app-button>
          <app-button variant="primary" (btnClick)="editType(selectedType)" [disabled]="!selectedType">تعديل النوع</app-button>
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

    .types-list-container {
      margin-top: 1rem;
    }

    .type-name {
      min-width: 150px;
    }

    .name-text {
      font-weight: 600;
      color: var(--text-color);
    }

    .type-description {
      min-width: 200px;
      max-width: 400px;
    }

    .description-text {
      color: var(--text-color);
      word-break: break-word;
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

      .type-description {
        max-width: 200px;
      }

      .info-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class AttendanceTypesListComponent implements OnInit {
  types: any[] = [];
  filteredTypes: any[] = [];
  loading = false;
  saving = false;
  error = '';
  searchQuery = '';
  viewModalVisible = false;
  selectedType: any = null;

  constructor(private sb: SupabaseService) {}

  async ngOnInit() {
    await this.loadTypes();
  }

  async loadTypes() {
    try {
      this.loading = true;
      this.error = '';
      const { data, error } = await this.sb.rpc('attendance_types_get');
      
      if (error) throw error;
      
      this.types = data ?? [];
      this.filteredTypes = [...this.types];
    } catch (error: any) {
      console.error('Error loading types:', error);
      this.error = 'حدث خطأ أثناء تحميل أنواع الحضور';
    } finally {
      this.loading = false;
    }
  }

  filterTypes() {
    let filtered = [...this.types];

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(type => 
        type.name?.toLowerCase().includes(query) ||
        type.description?.toLowerCase().includes(query)
      );
    }

    this.filteredTypes = filtered;
  }

  clearSearch() {
    this.searchQuery = '';
    this.filteredTypes = [...this.types];
  }

  navigateToNew() {
    window.location.href = '/attendance-types/new';
  }

  editType(type: any) {
    if (type.id) {
      window.location.href = `/attendance-types/edit/${type.id}`;
    }
  }

  viewType(type: any) {
    this.selectedType = type;
    this.viewModalVisible = true;
  }

  closeViewModal() {
    this.viewModalVisible = false;
    this.selectedType = null;
  }

  async deleteType(type: any) {
    if (!type.id) return;
    
    const confirmed = confirm(`هل أنت متأكد من حذف نوع الحضور "${type.name}"؟`);
    if (!confirmed) return;
    
    try {
      this.saving = true;
      const { data, error } = await this.sb.rpc('attendance_types_delete', { _id: type.id });
      
      if (error) {
        const msg = error.message || '';
        const code = (error as any).code || '';
        if (code === '23503' || /foreign key/i.test(msg) || /violat(es|ed) foreign key/i.test(msg)) {
          this.error = 'تعذر حذف نوع الحضور لوجود سجلات مرتبطة به. يرجى إزالة الارتباطات أولاً.';
        } else {
          throw error;
        }
        return;
      }
      
      if (data) {
        this.types = this.types.filter(t => t.id !== type.id);
        this.filteredTypes = this.filteredTypes.filter(t => t.id !== type.id);
      } else {
        this.error = 'لم يتم العثور على نوع الحضور المراد حذفه';
      }
    } catch (error: any) {
      console.error('Error deleting type:', error);
      this.error = 'حدث خطأ أثناء حذف نوع الحضور';
    } finally {
      this.saving = false;
    }
  }
}
