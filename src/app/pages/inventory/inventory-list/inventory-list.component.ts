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
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SpinnerComponent, ButtonComponent, CardComponent, DeleteConfirmationComponent],
  template: `
    <div class="page-header">
      <div class="header-content">
        <h1>عناصر المخزون</h1>
        <p class="page-subtitle">إدارة عناصر المخزون (إضافة، تعديل، حذف)</p>
      </div>
      <app-button variant="primary" (btnClick)="navigateToNew()" [disabled]="loading">+ إضافة عنصر</app-button>
    </div>

    <div class="filters">
      <label for="search">البحث بالاسم</label>
      <input id="search" type="text" [(ngModel)]="searchQuery" (ngModelChange)="noop()" placeholder="اكتب اسم العنصر..." />
    </div>

    <app-spinner *ngIf="loading" [overlay]="false" message="جاري تحميل عناصر المخزون..."></app-spinner>

    <app-card *ngIf="!loading" [title]="'قائمة عناصر المخزون'">
      <div class="table-responsive">
        <table class="items-table">
          <thead>
            <tr>
              <th>الاسم</th>
              <th>الوحدة</th>
              <th>الوصف</th>
              <th>تاريخ الإنشاء</th>
              <th style="width: 160px">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of filteredItems">
              <td>{{ item.name }}</td>
              <td>{{ item.unit }}</td>
              <td>{{ item.description || '-' }}</td>
              <td>{{ item.created_at | date:'short' }}</td>
              <td class="actions">
                <app-button size="sm" variant="outline" (btnClick)="editItem(item)">تعديل</app-button>
                <app-button size="sm" variant="danger" (btnClick)="openDeleteModal(item)" [disabled]="saving">
                  🗑️ حذف
                </app-button>
              </td>
            </tr>
            <tr *ngIf="items.length===0">
              <td colspan="5" class="empty">لا توجد عناصر</td>
            </tr>
          </tbody>
        </table>
      </div>
    </app-card>

    <!-- Delete Confirmation Modal -->
    <app-delete-confirmation
      [visible]="deleteModalVisible"
      [title]="'حذف عنصر'"
      [message]="'هل أنت متأكد من أنك تريد حذف هذا العنصر؟'"
      [itemName]="itemToDelete?.name"
      [loading]="saving"
      (confirm)="confirmDelete()"
      (cancel)="cancelDelete()">
    </app-delete-confirmation>
  `,
  styles: [`
    .page-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1rem}
    .page-subtitle{color:var(--muted-text)}
    .filters{display:flex;gap:.5rem;align-items:center;margin:0 0 1rem}
    .filters input{padding:.5rem .75rem;border:2px solid var(--border-color);border-radius:8px;min-width:260px}
    .table-responsive{overflow:auto}
    table{width:100%;border-collapse:collapse}
    th,td{padding:12px;border-bottom:1px solid var(--border-color);text-align:right}
    thead th{background:#fafafa}
    .actions{display:flex;gap:.5rem}
    .empty{text-align:center;color:var(--muted-text)}
  `]
})
export class InventoryListComponent implements OnInit {
  items: any[] = [];
  loading = false;
  saving = false;
  deleteModalVisible = false;
  itemToDelete: any = null;
  searchQuery = '';

  constructor(private sb: SupabaseService, private router: Router) {}

  async ngOnInit() {
    await this.loadItems();
  }

  async loadItems() {
    this.loading = true;
    try {
      const { data, error } = await this.sb.rpc('inventory_items_get');
      if (error) throw error;
      this.items = data || [];
    } catch (e) {
      console.error('Error loading inventory items', e);
      this.items = [];
    } finally {
      this.loading = false;
    }
  }

  get filteredItems() {
    const q = (this.searchQuery || '').toLowerCase().trim();
    if (!q) return this.items;
    return this.items.filter(i => (i.name || '').toLowerCase().includes(q));
  }

  noop() {}

  navigateToNew() {
    this.router.navigate(['inventory','new']);
  }

  editItem(item: any) {
    if (item?.id) this.router.navigate(['inventory','edit', item.id]);
  }

  openDeleteModal(item: any) {
    if (!item?.id) return;
    this.itemToDelete = item;
    this.deleteModalVisible = true;
  }

  async confirmDelete() {
    if (!this.itemToDelete?.id) return;
    try {
      this.saving = true;
      const { data, error } = await this.sb.rpc('inventory_items_delete', { _id: this.itemToDelete.id });
      if (error) throw error;
      // Remove from local list for snappier UX
      this.items = this.items.filter(i => i.id !== this.itemToDelete.id);
      this.cancelDelete();
    } catch (e) {
      console.error('Error deleting item', e);
    } finally {
      this.saving = false;
    }
  }

  cancelDelete() {
    this.deleteModalVisible = false;
    this.itemToDelete = null;
  }
}
