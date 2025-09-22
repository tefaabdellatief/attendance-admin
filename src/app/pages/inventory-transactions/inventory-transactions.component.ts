import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SupabaseService } from '../../core/supabase.service';
import { SpinnerComponent } from '../../core/ui/components/spinner/spinner.component';
import { ButtonComponent } from '../../core/ui/components/button/button.component';
import { CardComponent } from '../../core/ui/components/card/card.component';

@Component({
  selector: 'app-inventory-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SpinnerComponent, ButtonComponent, CardComponent, DatePipe],
  template: `
    <div class="page-header">
      <div class="header-content">
        <h1>سجل حركات المخزون</h1>
        <p class="page-subtitle">عرض وتحليل كل التحويلات والإضافات والخصومات</p>
      </div>
    </div>

    <div class="filters">
      <div class="filter">
        <label for="branch">الفرع</label>
        <select id="branch" [(ngModel)]="branchId">
          <option [ngValue]="null">الكل</option>
          <option *ngFor="let b of branches" [ngValue]="b.id">{{ b.name }}</option>
        </select>
      </div>
      <div class="filter">
        <label for="item">العنصر</label>
        <select id="item" [(ngModel)]="itemId">
          <option [ngValue]="null">الكل</option>
          <option *ngFor="let i of itemsCatalog" [ngValue]="i.id">{{ i.name }} ({{ i.unit }})</option>
        </select>
      </div>
      <app-button variant="primary" size="sm" (btnClick)="applyFilters()" [disabled]="loading">تطبيق</app-button>
      <app-button variant="outline" size="sm" (btnClick)="resetFilters()" [disabled]="loading">إعادة ضبط</app-button>
    </div>

    <app-spinner *ngIf="loading" [overlay]="false" message="جاري تحميل السجل..."></app-spinner>

    <app-card *ngIf="!loading" [title]="'سجل الحركات'" [subtitle]="subtitle">
      <div class="table-responsive">
        <table class="tx-table">
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>الفرع</th>
              <th>العنصر</th>
              <th>الكمية</th>
              <th>النوع</th>
              <th>ملاحظة</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let t of transactions">
              <td>{{ t.created_at | date:'short' }}</td>
              <td>{{ getBranchName(t.branch_id) }}</td>
              <td>{{ getItemName(t.item_id) }} ({{ getItemUnit(t.item_id) }})</td>
              <td>
                <span [class.pos]="t.quantity >= 0" [class.neg]="t.quantity < 0">{{ t.quantity }}</span>
              </td>
              <td>{{ t.transaction_type }}</td>
              <td>{{ formatNote(t.note) }}</td>
            </tr>
            <tr *ngIf="transactions.length===0">
              <td colspan="6" class="empty">لا توجد معاملات مطابقة</td>
            </tr>
          </tbody>
        </table>
      </div>
    </app-card>
  `,
  styles: [`
    .page-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1rem}
    .page-subtitle{color:var(--muted-text)}
    .filters{display:flex;gap:.75rem;align-items:flex-end;margin:0 0 1rem}
    .filter{display:flex;flex-direction:column}
    label{font-weight:600;margin-bottom:.25rem}
    select{padding:.5rem .75rem;border:2px solid var(--border-color);border-radius:8px;min-width:220px}
    .table-responsive{overflow:auto}
    table{width:100%;border-collapse:collapse}
    th,td{padding:12px;border-bottom:1px solid var(--border-color);text-align:right}
    thead th{background:#fafafa}
    .empty{text-align:center;color:var(--muted-text)}
    .pos{color:#137333;font-weight:600}
    .neg{color:#c62828;font-weight:600}
  `]
})
export class InventoryTransactionsComponent implements OnInit {
  branches: any[] = [];
  itemsCatalog: any[] = [];
  transactions: any[] = [];

  branchId: string | null = null;
  itemId: string | null = null;

  loading = false;

  constructor(private sb: SupabaseService) {}

  get subtitle(): string {
    const parts: string[] = [];
    if (this.branchId) parts.push('الفرع: ' + this.getBranchName(this.branchId));
    if (this.itemId) parts.push('العنصر: ' + this.getItemName(this.itemId));
    return parts.length ? parts.join(' | ') : 'كل المعاملات';
  }

  formatNote(note: any): string {
    if (!note) return '-';
    let s = String(note);
    // Replace any occurrence of a known branch UUID with its name
    for (const b of this.branches) {
      if (!b?.id || !b?.name) continue;
      try {
        const re = new RegExp(b.id, 'g');
        s = s.replace(re, b.name);
      } catch { /* ignore invalid regex */ }
    }
    return s;
  }

  async ngOnInit() {
    await Promise.all([this.loadBranches(), this.loadItemsCatalog()]);
    await this.loadAll();
  }

  async loadBranches() {
    try {
      const { data } = await this.sb.rpc('branches_get');
      this.branches = data || [];
    } catch (e) { this.branches = []; }
  }

  async loadItemsCatalog() {
    try {
      const { data } = await this.sb.rpc('inventory_items_get');
      this.itemsCatalog = data || [];
    } catch (e) { this.itemsCatalog = []; }
  }

  async loadAll() {
    this.loading = true;
    try {
      const { data, error } = await this.sb.rpc('inventory_transactions_get');
      if (error) throw error;
      this.transactions = data || [];
    } catch (e) {
      console.error('Error loading transactions', e);
      this.transactions = [];
    } finally {
      this.loading = false;
    }
  }

  async applyFilters() {
    this.loading = true;
    try {
      if (this.branchId && !this.itemId) {
        const { data, error } = await this.sb.rpc('inventory_transactions_get_by_branch', { _branch_id: this.branchId });
        if (error) throw error;
        this.transactions = data || [];
        return;
      }
      if (this.itemId && !this.branchId) {
        const { data, error } = await this.sb.rpc('inventory_transactions_get_by_item', { _item_id: this.itemId });
        if (error) throw error;
        this.transactions = data || [];
        return;
      }
      if (this.itemId && this.branchId) {
        // When both are selected, filter client-side from branch query for simplicity
        const { data, error } = await this.sb.rpc('inventory_transactions_get_by_branch', { _branch_id: this.branchId });
        if (error) throw error;
        const rows = data || [];
        this.transactions = rows.filter((r: any) => r.item_id === this.itemId);
        return;
      }
      await this.loadAll();
    } catch (e) {
      console.error('Error applying filters', e);
      this.transactions = [];
    } finally {
      this.loading = false;
    }
  }

  resetFilters() {
    this.branchId = null;
    this.itemId = null;
    this.loadAll();
  }

  getBranchName(id: string | null): string {
    if (!id) return '-';
    return this.branches.find(b => b.id === id)?.name || id;
  }

  getItemName(id: string | null): string {
    if (!id) return '-';
    return this.itemsCatalog.find(i => i.id === id)?.name || id;
  }

  getItemUnit(id: string | null): string {
    if (!id) return '';
    return this.itemsCatalog.find(i => i.id === id)?.unit || '';
  }
}
