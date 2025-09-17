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
  selector: 'app-branches-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SpinnerComponent, ButtonComponent, CardComponent, DeleteConfirmationComponent, EnhancedSearchComponent],
  template: `
    <div class="page-header">
      <div class="header-content">
        <h1>الفروع</h1>
        <p class="page-subtitle">إدارة فروع العمل في النظام</p>
      </div>
      <app-button 
        variant="primary" 
        (btnClick)="navigateToNew()"
        [disabled]="loading">
        <span>➕</span> إضافة فرع جديد
      </app-button>
    </div>

    <!-- Search Bar -->
    <div class="search-bar">
      <div class="search-section">
        <app-enhanced-search
          [(ngModel)]="searchQuery"
          placeholder="البحث في الفروع بالاسم أو العنوان..."
          (search)="filterBranches()"
          (clear)="clearSearch()">
        </app-enhanced-search>
      </div>
    </div>

    <!-- Loading State -->
    <app-spinner *ngIf="loading" [overlay]="false" message="جاري تحميل الفروع..."></app-spinner>

    <!-- Error State -->
    <div *ngIf="error && !loading" class="error-message">
      <span>⚠️</span>
      <p>{{ error }}</p>
      <app-button variant="outline" size="sm" (btnClick)="loadBranches()">إعادة المحاولة</app-button>
    </div>

    <!-- Branches List -->
    <div *ngIf="!loading && !error" class="branches-list-container">
      <app-card *ngIf="filteredBranches.length" [title]="'قائمة الفروع'" [subtitle]="'إجمالي ' + filteredBranches.length + ' فرع'">
        <div class="table-container">
          <table class="app-table">
            <thead>
              <tr>
                <th>الاسم</th>
                <th>العنوان</th>
                <th>خط العرض</th>
                <th>خط الطول</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let branch of filteredBranches">
                <td class="branch-name">
                  <span class="name-text">{{ branch.name }}</span>
                </td>
                <td class="branch-address">
                  <span class="address-text">{{ branch.address || '-' }}</span>
                </td>
                <td class="coordinates">
                  <span class="coordinate-badge" *ngIf="branch.latitude; else noLat">{{ branch.latitude }}</span>
                  <ng-template #noLat>-</ng-template>
                </td>
                <td class="coordinates">
                  <span class="coordinate-badge" *ngIf="branch.longitude; else noLng">{{ branch.longitude }}</span>
                  <ng-template #noLng>-</ng-template>
                </td>
                <td class="actions">
                  <div class="action-buttons">
                    <app-button 
                      variant="primary" 
                      size="sm" 
                      (btnClick)="viewBranch(branch)"
                      [disabled]="saving">
                      👁️ عرض
                    </app-button>
                    <app-button 
                      variant="outline" 
                      size="sm" 
                      (btnClick)="editBranch(branch)"
                      [disabled]="saving">
                      ✏️ تعديل
                    </app-button>
                    <app-button 
                      variant="danger" 
                      size="sm" 
                      (btnClick)="deleteBranch(branch)"
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
      <div *ngIf="!filteredBranches.length" class="empty-state">
        <div class="empty-icon">🏢</div>
        <h3>لا توجد فروع</h3>
        <p *ngIf="searchQuery">لم يتم العثور على فروع تطابق البحث المحدد</p>
        <p *ngIf="!searchQuery">لم يتم إضافة أي فروع بعد</p>
        <app-button 
          *ngIf="!searchQuery" 
          variant="primary" 
          (btnClick)="navigateToNew()">
          إضافة أول فرع
        </app-button>
      </div>
    </div>

    <!-- View Branch Modal -->
    <div class="modal-overlay" [class.visible]="viewModalVisible" (click)="closeViewModal()">
      <div class="modal" [class.visible]="viewModalVisible" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>عرض بيانات الفرع</h3>
          <button type="button" (click)="closeViewModal()">×</button>
        </div>
        <div class="modal-body" *ngIf="selectedBranch">
          <div class="info-section">
            <h4>معلومات الفرع</h4>
            <div class="info-grid">
              <div class="info-item">
                <label>الاسم:</label>
                <span>{{ selectedBranch.name }}</span>
              </div>
              <div class="info-item">
                <label>العنوان:</label>
                <span>{{ selectedBranch.address || '-' }}</span>
              </div>
              <div class="info-item">
                <label>خط العرض:</label>
                <span>{{ selectedBranch.latitude ?? '-' }}</span>
              </div>
              <div class="info-item">
                <label>خط الطول:</label>
                <span>{{ selectedBranch.longitude ?? '-' }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <app-button variant="outline" (btnClick)="closeViewModal()">إغلاق</app-button>
          <app-button variant="primary" (btnClick)="editBranch(selectedBranch)" [disabled]="!selectedBranch">تعديل الفرع</app-button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <app-delete-confirmation
      [visible]="deleteModalVisible"
      [title]="'حذف الفرع'"
      [message]="'هل أنت متأكد من أنك تريد حذف هذا الفرع؟'"
      [itemName]="branchToDelete?.name"
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

    .branches-list-container {
      margin-top: 1rem;
    }

    .branch-name {
      min-width: 150px;
    }

    .name-text {
      font-weight: 600;
      color: var(--text-color);
    }

    .branch-address {
      min-width: 200px;
      max-width: 300px;
    }

    .address-text {
      color: var(--text-color);
      word-break: break-word;
    }

    .coordinates {
      width: 120px;
    }

    .coordinate-badge {
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
      width: min(700px, 95vw);
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
      padding: 1.25rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 1.1rem;
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
      padding: 1.5rem;
      max-height: 60vh;
      overflow-y: auto;
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border-color);
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
      background: #f8f9fa;
    }

    .info-section {
      background: #fff;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 1rem;
    }

    .info-section h4 {
      margin: 0 0 1rem 0;
      color: var(--color-primary-dark);
      font-size: 1rem;
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

      .branch-address {
        max-width: 150px;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class BranchesListComponent implements OnInit {
  branches: any[] = [];
  filteredBranches: any[] = [];
  loading = false;
  saving = false;
  error = '';
  searchQuery = '';
  deleteModalVisible = false;
  branchToDelete: any = null;
  viewModalVisible = false;
  selectedBranch: any = null;

  constructor(private sb: SupabaseService) {}

  async ngOnInit() {
    await this.loadBranches();
  }

  async loadBranches() {
    try {
      this.loading = true;
      this.error = '';
      const { data, error } = await this.sb.rpc('branches_get');
      
      if (error) throw error;
      
      this.branches = data ?? [];
      this.filteredBranches = [...this.branches];
    } catch (error: any) {
      console.error('Error loading branches:', error);
      this.error = 'حدث خطأ أثناء تحميل الفروع';
    } finally {
      this.loading = false;
    }
  }

  filterBranches() {
    let filtered = [...this.branches];

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(branch => 
        branch.name?.toLowerCase().includes(query) ||
        branch.address?.toLowerCase().includes(query)
      );
    }

    this.filteredBranches = filtered;
  }

  clearSearch() {
    this.searchQuery = '';
    this.filteredBranches = [...this.branches];
  }

  navigateToNew() {
    window.location.href = '/branches/new';
  }

  editBranch(branch: any) {
    if (branch.id) {
      window.location.href = `/branches/edit/${branch.id}`;
    }
  }

  viewBranch(branch: any) {
    this.selectedBranch = branch;
    this.viewModalVisible = true;
  }

  closeViewModal() {
    this.viewModalVisible = false;
    this.selectedBranch = null;
  }

  deleteBranch(branch: any) {
    if (!branch.id) return;
    this.branchToDelete = branch;
    this.deleteModalVisible = true;
  }

  async confirmDelete() {
    if (!this.branchToDelete?.id) return;
    
    try {
      this.saving = true;
      const { data, error } = await this.sb.rpc('branches_delete', { _id: this.branchToDelete.id });
      
      if (error) {
        const msg = error.message || '';
        const code = (error as any).code || '';
        if (code === '23503' || /foreign key/i.test(msg) || /violat(es|ed) foreign key/i.test(msg)) {
          this.error = 'تعذر حذف الفرع لوجود سجلات مرتبطة به (مثل سجلات الحضور أو المستخدمين). يرجى إزالة الارتباطات أولاً.';
        } else {
          throw error;
        }
        return;
      }
      
      if (data) {
        this.branches = this.branches.filter(b => b.id !== this.branchToDelete.id);
        this.filteredBranches = this.filteredBranches.filter(b => b.id !== this.branchToDelete.id);
        this.cancelDelete();
      } else {
        this.error = 'لم يتم العثور على الفرع المراد حذفه';
      }
    } catch (error: any) {
      console.error('Error deleting branch:', error);
      this.error = 'حدث خطأ أثناء حذف الفرع';
    } finally {
      this.saving = false;
    }
  }

  cancelDelete() {
    this.deleteModalVisible = false;
    this.branchToDelete = null;
  }
}
