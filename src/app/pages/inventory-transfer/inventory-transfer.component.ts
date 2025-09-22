import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SupabaseService } from '../../core/supabase.service';
import { SpinnerComponent } from '../../core/ui/components/spinner/spinner.component';
import { ButtonComponent } from '../../core/ui/components/button/button.component';
import { CardComponent } from '../../core/ui/components/card/card.component';

@Component({
  selector: 'app-inventory-transfer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SpinnerComponent, ButtonComponent, CardComponent],
  template: `
    <div class="page-header">
      <div class="header-content">
        <h1>تحويل مخزون بين الفروع</h1>
        <p class="page-subtitle">انقل كمية من صنف من فرع إلى آخر</p>
      </div>
    </div>

    <app-spinner *ngIf="loading" [overlay]="false" message="جاري التحميل..."></app-spinner>

    <div *ngIf="!loading">
      <app-card [title]="'بيانات التحويل'">
        <form (ngSubmit)="onSubmit()" #form="ngForm" class="transfer-form">
          <div class="form-grid">
            <div class="form-group">
              <label for="source">الفرع المصدر <span class="required">*</span></label>
              <select id="source" name="source" class="form-control" [(ngModel)]="source_branch_id" required>
                <option [ngValue]="null">— اختر الفرع المصدر —</option>
                <option *ngFor="let b of branches" [ngValue]="b.id">{{ b.name }}</option>
              </select>
            </div>

            <div class="form-group">
              <label for="target">الفرع الهدف <span class="required">*</span></label>
              <select id="target" name="target" class="form-control" [(ngModel)]="target_branch_id" required>
                <option [ngValue]="null">— اختر الفرع الهدف —</option>
                <option *ngFor="let b of branches" [ngValue]="b.id">{{ b.name }}</option>
              </select>
            </div>

            <div class="form-group">
              <label for="item">العنصر <span class="required">*</span></label>
              <select id="item" name="item" class="form-control" [(ngModel)]="item_id" required>
                <option [ngValue]="null">— اختر العنصر —</option>
                <option *ngFor="let i of itemsCatalog" [ngValue]="i.id">{{ i.name }} ({{ i.unit }})</option>
              </select>
            </div>

            <div class="form-group">
              <label for="quantity">الكمية <span class="required">*</span></label>
              <input id="quantity" name="quantity" type="number" min="0" step="0.01" class="form-control" [(ngModel)]="quantity" required placeholder="أدخل الكمية">
            </div>

            <div class="form-group full-width">
              <label for="note">ملاحظة</label>
              <textarea id="note" name="note" class="form-control" [(ngModel)]="note" rows="3" placeholder="اختياري"></textarea>
            </div>
          </div>

          <div class="form-actions">
            <app-button type="submit" variant="primary" [disabled]="saving || !form.form.valid" [loading]="saving">تحويل</app-button>
          </div>

          <div class="form-error" *ngIf="formError">
            <span>⚠️</span>
            <p>{{ formError }}</p>
          </div>

          <div class="form-success" *ngIf="successMessage">
            <span>✅</span>
            <p>{{ successMessage }}</p>
          </div>
        </form>
      </app-card>
    </div>
  `,
  styles: [`
    .page-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1rem}
    .page-subtitle{color:var(--muted-text)}
    .transfer-form{max-width:900px;margin:0 auto;padding:0 1rem}
    .form-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1.5rem}
    .form-group{display:flex;flex-direction:column}
    .form-group.full-width{grid-column:1 / -1}
    label{font-weight:600;margin-bottom:.5rem}
    .form-control{padding:0.75rem 1rem;border:2px solid var(--border-color);border-radius:8px}
    .form-actions{display:flex;gap:1rem;justify-content:flex-end;margin-top:1.5rem;padding:1rem;background:#f8f9fa;border:1px solid var(--border-color);border-radius:8px}
    .form-error{margin-top:1rem;color:#c62828;display:flex;gap:.5rem;align-items:center}
    .form-success{margin-top:1rem;color:#137333;display:flex;gap:.5rem;align-items:center}
    @media (max-width:768px){.form-grid{grid-template-columns:1fr}}
  `]
})
export class InventoryTransferComponent implements OnInit {
  branches: any[] = [];
  itemsCatalog: any[] = [];

  source_branch_id: string | null = null;
  target_branch_id: string | null = null;
  item_id: string | null = null;
  quantity: number | null = null;
  note: string | null = null;

  loading = false;
  saving = false;
  formError = '';
  successMessage = '';

  constructor(private sb: SupabaseService) {}

  async ngOnInit() {
    await Promise.all([this.loadBranches(), this.loadItemsCatalog()]);
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

  async onSubmit() {
    this.formError = '';
    this.successMessage = '';

    const qty = Number(this.quantity ?? 0);
    if (!this.source_branch_id || !this.target_branch_id) {
      this.formError = 'يرجى اختيار الفرع المصدر والهدف';
      return;
    }
    if (this.source_branch_id === this.target_branch_id) {
      this.formError = 'لا يمكن أن يكون الفرع المصدر والهدف متطابقين';
      return;
    }
    if (!this.item_id) {
      this.formError = 'يرجى اختيار العنصر';
      return;
    }
    if (isNaN(qty) || qty <= 0) {
      this.formError = 'الكمية يجب أن تكون أكبر من صفر';
      return;
    }

    try {
      this.saving = true;
      const { data, error } = await this.sb.rpc('inventory_transfer_stock', {
        _source_branch_id: this.source_branch_id,
        _target_branch_id: this.target_branch_id,
        _item_id: this.item_id,
        _quantity: qty,
        _note: this.note?.trim() || null
      });
      if (error) throw error;

      // Procedure returns JSON with status/message
      const status = (data as any)?.status;
      const message = (data as any)?.message || 'تم التحويل بنجاح';
      if (status === 'error') {
        this.formError = message;
        return;
      }
      this.successMessage = message;
      // Optionally reset quantity/note
      this.quantity = null;
      this.note = null;
    } catch (e: any) {
      console.error('Error transferring stock', e);
      this.formError = e?.message || 'فشل تنفيذ التحويل';
    } finally {
      this.saving = false;
    }
  }
}
