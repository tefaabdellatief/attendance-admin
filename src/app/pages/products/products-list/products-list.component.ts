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
  selector: 'app-products-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SpinnerComponent, ButtonComponent, CardComponent, DeleteConfirmationComponent],
  template: `
    <div class="page-header">
      <div class="header-content">
        <h1>المنتجات</h1>
        <p class="page-subtitle">إدارة المنتجات</p>
      </div>
      <app-button variant="primary" (btnClick)="navigateToNew()" [disabled]="loading">+ إضافة منتج</app-button>
    </div>

    <div class="filters">
      <label for="search">بحث بالاسم</label>
      <input id="search" type="text" [(ngModel)]="searchQuery" placeholder="اكتب اسم المنتج..." />
      <label for="cat">التصنيف</label>
      <select id="cat" [(ngModel)]="categoryFilter">
        <option [ngValue]="''">الكل</option>
        <option *ngFor="let c of categories" [ngValue]="c.id">{{ c.name }}</option>
      </select>
    </div>

    <app-spinner *ngIf="loading" [overlay]="false" message="جاري تحميل المنتجات..."></app-spinner>

    <app-card *ngIf="!loading" [title]="'قائمة المنتجات'">
      <div class="table-responsive">
        <table class="items-table">
          <thead>
            <tr>
              <th>#</th>
              <th>الاسم</th>
              <th>التصنيف</th>
              <th>سعر البيع</th>
              <th>سعر الشراء</th>
              <th>متاح؟</th>
              <th>تاريخ الإنشاء</th>
              <th style="width: 200px">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of filtered">
              <td>{{ p.prod_id }}</td>
              <td>{{ p.name }}</td>
              <td>{{ getCategoryName(p.category_id) }}</td>
              <td>{{ p.sale_price }}</td>
              <td>{{ p.buy_price }}</td>
              <td>{{ p.is_available ? '✓' : '—' }}</td>
              <td>{{ p.created_at | date:'short' }}</td>
              <td class="actions">
                <app-button size="sm" variant="secondary" (btnClick)="view(p)">عرض</app-button>
                <app-button size="sm" (btnClick)="openRecipes(p)">الوصفة</app-button>
                <app-button size="sm" variant="outline" (btnClick)="edit(p)">تعديل</app-button>
                <app-button size="sm" variant="danger" (btnClick)="openDeleteModal(p)" [disabled]="saving">🗑️ حذف</app-button>
              </td>
            </tr>
            <tr *ngIf="filtered.length===0">
              <td colspan="8" class="empty">لا توجد منتجات</td>
            </tr>
          </tbody>
        </table>
      </div>
    </app-card>

    <!-- Delete Confirmation Modal -->
    <app-delete-confirmation
      [visible]="deleteModalVisible"
      [title]="'حذف منتج'"
      [message]="'هل أنت متأكد من حذف هذا المنتج؟'"
      [itemName]="productToDelete?.name"
      [loading]="saving"
      (confirm)="confirmDelete()"
      (cancel)="cancelDelete()">
    </app-delete-confirmation>
  `,
  styles: [`
    .page-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1rem}
    .page-subtitle{color:var(--muted-text)}
    .filters{display:flex;gap:.5rem;align-items:center;margin:0 0 1rem;flex-wrap:wrap}
    .filters input,.filters select{padding:.5rem .75rem;border:2px solid var(--border-color);border-radius:8px;min-width:220px}
    .table-responsive{overflow:auto}
    table{width:100%;border-collapse:collapse}
    th,td{padding:12px;border-bottom:1px solid var(--border-color);text-align:right}
    thead th{background:#fafafa}
    .actions{display:flex;gap:.5rem}
    .empty{text-align:center;color:var(--muted-text)}
  `]
})
export class ProductsListComponent implements OnInit {
  products: any[] = [];
  categories: any[] = [];
  loading = false;
  saving = false;
  searchQuery = '';
  categoryFilter: string = '';
  deleteModalVisible = false;
  productToDelete: any = null;

  constructor(private sb: SupabaseService, private router: Router) {}

  async ngOnInit() {
    await Promise.all([this.loadCategories(), this.loadProducts()]);
  }

  async loadCategories() {
    try {
      const { data } = await this.sb.rpc('product_categories_get');
      this.categories = data || [];
    } catch (e) {
      console.error('Error loading categories', e);
      this.categories = [];
    }
  }

  async loadProducts() {
    this.loading = true;
    try {
      const { data, error } = await this.sb.rpc('products_get');
      if (error) throw error;
      this.products = (data || []).sort((a: any, b: any) => {
        // Sort by prod_id or id, handling both numeric and string IDs
        const idA = a.prod_id || a.id;
        const idB = b.prod_id || b.id;
        return idA - idB;
      });
    } catch (e) {
      console.error('Error loading products', e);
      this.products = [];
    } finally {
      this.loading = false;
    }
  }

  get filtered() {
    const q = (this.searchQuery || '').toLowerCase().trim();
    const cat = this.categoryFilter || '';
    return this.products.filter(p => {
      const nameOk = !q || (p.name || '').toLowerCase().includes(q);
      const catOk = !cat || p.category_id === cat;
      return nameOk && catOk;
    });
  }

  getCategoryName(id: string) {
    return this.categories.find(c => c.id === id)?.name || id;
  }

  navigateToNew() {
    this.router.navigate(['products','new']);
  }

  edit(p: any) {
    if (!p?.id) return;
    this.router.navigate(['products','edit', p.id]);
  }

  openRecipes(p: any) {
    const pid = p?.id || p?.prod_id || p?.product_id;
    if (!pid) return;
    this.router.navigate(['products','recipes', pid]);
  }

  view(p: any) {
    const pid = p?.id || p?.prod_id || p?.product_id;
    if (!pid) return;
    this.router.navigate(['products','view', pid]);
  }

  openDeleteModal(p: any) {
    this.productToDelete = p;
    this.deleteModalVisible = true;
  }

  async confirmDelete() {
    if (!this.productToDelete?.id) return;
    try {
      this.saving = true;
      const { error } = await this.sb.rpc('products_delete', { p_id: this.productToDelete.id });
      if (error) throw error;
      this.products = this.products.filter(x => x.id !== this.productToDelete.id);
      this.cancelDelete();
    } catch (e) {
      console.error('Error deleting product', e);
    } finally {
      this.saving = false;
    }
  }

  cancelDelete() {
    this.deleteModalVisible = false;
    this.productToDelete = null;
  }
}
