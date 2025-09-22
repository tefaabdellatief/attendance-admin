import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../../core/supabase.service';
import { SpinnerComponent } from '../../../core/ui/components/spinner/spinner.component';
import { ButtonComponent } from '../../../core/ui/components/button/button.component';
import { CardComponent } from '../../../core/ui/components/card/card.component';
import { DeleteConfirmationComponent } from '../../../core/ui/components/delete-confirmation/delete-confirmation.component';

@Component({
  selector: 'app-branch-inventory-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SpinnerComponent, ButtonComponent, CardComponent, DeleteConfirmationComponent],
  template: `
    <div class="page-header">
      <div class="header-content">
        <h1>مخزون الفروع</h1>
        <p class="page-subtitle">إدارة مخزون العناصر لكل فرع</p>
      </div>
      <app-button variant="primary" (btnClick)="navigateToNew()" [disabled]="loading || !selectedBranchId">+ إضافة إلى المخزون</app-button>
    </div>

    <div class="filters">
      <label for="branch">اختر الفرع</label>
      <select id="branch" [(ngModel)]="selectedBranchId" (ngModelChange)="onBranchChange($event)">
        <option [ngValue]="null">— اختر فرع —</option>
        <option *ngFor="let b of branches" [ngValue]="b.id">{{ b.name }}</option>
      </select>
    </div>

    <app-spinner *ngIf="loading" [overlay]="false" message="جاري تحميل مخزون الفرع..."></app-spinner>

    <ng-container *ngIf="!loading">
      <app-card [title]="'مخزون الفرع'" [subtitle]="currentBranchName">
        <div class="table-responsive">
          <table class="items-table">
            <thead>
              <tr>
                <th>العنصر</th>
                <th>الوحدة</th>
                <th>الكمية</th>
                <th>آخر تحديث</th>
                <th style="width: 180px">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of stock">
                <td>{{ getItemName(r.item_id) }}</td>
                <td>{{ getItemUnit(r.item_id) }}</td>
                <td>{{ r.quantity }}</td>
                <td>{{ r.updated_at || r.created_at | date:'short' }}</td>
                <td class="actions">
                  <app-button size="sm" variant="outline" (btnClick)="editStock(r)">تعديل</app-button>
                  <app-button size="sm" variant="danger" (btnClick)="openDeleteModal(r)" [disabled]="saving">🗑️ حذف</app-button>
                </td>
              </tr>
              <tr *ngIf="stock.length===0">
                <td colspan="5" class="empty">لا توجد عناصر لهذا الفرع</td>
              </tr>
            </tbody>
          </table>
        </div>
      </app-card>
    </ng-container>

    <!-- Delete Confirmation Modal -->
    <app-delete-confirmation
      [visible]="deleteModalVisible"
      [title]="'حذف عنصر من مخزون الفرع'"
      [message]="'هل أنت متأكد من حذف هذا السجل من مخزون الفرع؟'"
      [itemName]="getItemName(stockToDelete?.item_id)"
      [loading]="saving"
      (confirm)="confirmDelete()"
      (cancel)="cancelDelete()">
    </app-delete-confirmation>
  `,
  styles: [`
    .page-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1rem}
    .page-subtitle{color:var(--muted-text)}
    .filters{display:flex;gap:.5rem;align-items:center;margin:0 0 1rem}
    .filters select{padding:.5rem .75rem;border:2px solid var(--border-color);border-radius:8px}
    .table-responsive{overflow:auto}
    table{width:100%;border-collapse:collapse}
    th,td{padding:12px;border-bottom:1px solid var(--border-color);text-align:right}
    thead th{background:#fafafa}
    .actions{display:flex;gap:.5rem}
    .empty{text-align:center;color:var(--muted-text)}
  `]
})
export class BranchInventoryListComponent implements OnInit {
  branches: any[] = [];
  itemsCatalog: any[] = [];
  stock: any[] = [];
  selectedBranchId: string | null = null;
  loading = false;
  saving = false;
  deleteModalVisible = false;
  stockToDelete: any = null;

  constructor(private sb: SupabaseService, private router: Router) {}

  async ngOnInit() {
    await this.loadBranches();
    await this.loadItemsCatalog();
  }

  get currentBranchName(): string {
    const b = this.branches.find(x => x.id === this.selectedBranchId);
    return b ? `الفرع: ${b.name}` : 'اختر فرعاً لعرض المخزون';
  }

  async loadBranches() {
    try {
      this.loading = true;
      const { data } = await this.sb.rpc('branches_get');
      this.branches = data || [];
    } catch (e) {
      console.error('Error loading branches', e);
      this.branches = [];
    } finally {
      this.loading = false;
    }
  }

  async loadItemsCatalog() {
    try {
      const { data } = await this.sb.rpc('inventory_items_get');
      this.itemsCatalog = data || [];
    } catch (e) {
      console.error('Error loading items catalog', e);
      this.itemsCatalog = [];
    }
  }

  async onBranchChange(branchId: string | null) {
    await this.loadStock();
  }

  async loadStock() {
    if (!this.selectedBranchId) {
      this.stock = [];
      return;
    }
    try {
      this.loading = true;
      const { data, error } = await this.sb.rpc('branch_inventory_get', { _branch_id: this.selectedBranchId });
      if (error) throw error;
      this.stock = data || [];
    } catch (e) {
      console.error('Error loading branch stock', e);
      this.stock = [];
    } finally {
      this.loading = false;
    }
  }

  getItemName(itemId: string): string {
    return this.itemsCatalog.find(i => i.id === itemId)?.name || itemId;
  }

  getItemUnit(itemId: string): string {
    return this.itemsCatalog.find(i => i.id === itemId)?.unit || '-';
  }

  navigateToNew() {
    if (!this.selectedBranchId) return;
    this.router.navigate(['branch-inventory','new'], { queryParams: { branch_id: this.selectedBranchId } });
  }

  editStock(row: any) {
    if (!row?.id) return;
    this.router.navigate(['branch-inventory','edit', row.id]);
  }

  openDeleteModal(row: any) {
    if (!row?.id) return;
    this.stockToDelete = row;
    this.deleteModalVisible = true;
  }

  async confirmDelete() {
    if (!this.stockToDelete?.id) return;
    try {
      this.saving = true;
      const { data, error } = await this.sb.rpc('branch_inventory_delete', { _id: this.stockToDelete.id });
      if (error) throw error;
      this.stock = this.stock.filter(s => s.id !== this.stockToDelete.id);
      this.cancelDelete();
    } catch (e) {
      console.error('Error deleting stock row', e);
    } finally {
      this.saving = false;
    }
  }

  cancelDelete() {
    this.deleteModalVisible = false;
    this.stockToDelete = null;
  }
}
