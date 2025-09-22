import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../../core/supabase.service';
import { SpinnerComponent } from '../../../core/ui/components/spinner/spinner.component';
import { ButtonComponent } from '../../../core/ui/components/button/button.component';
import { CardComponent } from '../../../core/ui/components/card/card.component';

@Component({
  selector: 'app-branch-inventory-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SpinnerComponent, ButtonComponent, CardComponent],
  template: `
    <div class="page-header">
      <div class="header-content">
        <h1>{{ rowId ? 'تعديل مخزون فرع' : 'إضافة مخزون لفرع' }}</h1>
        <p class="page-subtitle">{{ rowId ? 'تعديل كمية المخزون' : 'تعيين/إضافة كمية المخزون لعنصر في فرع' }}</p>
      </div>
      <app-button variant="outline" (btnClick)="goBack()" [disabled]="saving">← رجوع</app-button>
    </div>

    <app-spinner *ngIf="loading" [overlay]="false" message="جاري التحميل..."></app-spinner>

    <div *ngIf="!loading">
      <app-card [title]="'بيانات المخزون'">
        <form (ngSubmit)="onSubmit()" #form="ngForm" class="stock-form">
          <div class="form-grid">
            <div class="form-group" *ngIf="!rowId">
              <label for="branch">الفرع <span class="required">*</span></label>
              <select id="branch" name="branch" class="form-control" [(ngModel)]="branch_id" required>
                <option [ngValue]="null">— اختر فرع —</option>
                <option *ngFor="let b of branches" [ngValue]="b.id">{{ b.name }}</option>
              </select>
            </div>

            <div class="form-group" *ngIf="!rowId">
              <label for="item">العنصر <span class="required">*</span></label>
              <select id="item" name="item" class="form-control" [(ngModel)]="item_id" required>
                <option [ngValue]="null">— اختر عنصر —</option>
                <option *ngFor="let i of itemsCatalog" [ngValue]="i.id">{{ i.name }} ({{ i.unit }})</option>
              </select>
            </div>

            <div class="form-group">
              <label for="quantity">الكمية <span class="required">*</span></label>
              <input id="quantity" name="quantity" type="number" min="0" step="0.01" class="form-control" [(ngModel)]="quantity" required placeholder="أدخل الكمية">
              <small class="form-hint" *ngIf="rowId">الوحدة: {{ currentUnit }}</small>
            </div>
          </div>

          <div class="form-actions">
            <app-button type="submit" variant="primary" [disabled]="saving || !form.form.valid" [loading]="saving">{{ rowId ? 'حفظ' : 'إضافة' }}</app-button>
            <app-button type="button" variant="outline" (btnClick)="goBack()" [disabled]="saving">إلغاء</app-button>
          </div>

          <div class="form-error" *ngIf="formError">
            <span>⚠️</span>
            <p>{{ formError }}</p>
          </div>
        </form>
      </app-card>
    </div>
  `,
  styles: [`
    .page-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1rem}
    .page-subtitle{color:var(--muted-text)}
    .stock-form{max-width:900px;margin:0 auto;padding:0 1rem}
    .form-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1.5rem}
    .form-group{display:flex;flex-direction:column}
    label{font-weight:600;margin-bottom:.5rem}
    .form-control{padding:0.75rem 1rem;border:2px solid var(--border-color);border-radius:8px}
    .form-actions{display:flex;gap:1rem;justify-content:flex-end;margin-top:1.5rem;padding:1rem;background:#f8f9fa;border:1px solid var(--border-color);border-radius:8px}
    .form-error{margin-top:1rem;color:#c62828;display:flex;gap:.5rem;align-items:center}
    @media (max-width:768px){.form-grid{grid-template-columns:1fr}}
  `]
})
export class BranchInventoryFormComponent implements OnInit {
  rowId: string | null = null;
  branch_id: string | null = null;
  item_id: string | null = null;
  quantity: number | null = null;

  branches: any[] = [];
  itemsCatalog: any[] = [];

  loading = false;
  saving = false;
  formError = '';

  constructor(private route: ActivatedRoute, private router: Router, private sb: SupabaseService) {}

  get currentUnit(): string {
    return this.itemsCatalog.find(i => i.id === this.item_id)?.unit || '-';
  }

  async ngOnInit() {
    this.rowId = this.route.snapshot.paramMap.get('id');
    await this.loadBranches();
    await this.loadItemsCatalog();

    // Preselect branch from query param on create
    if (!this.rowId) {
      const qpBranch = this.route.snapshot.queryParamMap.get('branch_id');
      if (qpBranch) this.branch_id = qpBranch;
    }

    if (this.rowId) {
      await this.loadRow();
    }
  }

  async loadBranches() {
    try {
      const { data } = await this.sb.rpc('branches_get');
      this.branches = data || [];
    } catch (e) {
      console.error('Error loading branches', e);
      this.branches = [];
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

  async loadRow() {
    try {
      this.loading = true;
      const { data, error } = await this.sb.rpc('branch_inventory_get_by_id', { _id: this.rowId });
      if (error) throw error;
      if (!data) throw new Error('السجل غير موجود');
      this.branch_id = data.branch_id;
      this.item_id = data.item_id;
      this.quantity = Number(data.quantity ?? 0);
    } catch (e: any) {
      console.error('Error loading row', e);
      this.formError = e?.message || 'فشل تحميل بيانات المخزون';
    } finally {
      this.loading = false;
    }
  }

  async onSubmit() {
    this.formError = '';
    const qty = Number(this.quantity ?? 0);
    if (isNaN(qty) || qty < 0) {
      this.formError = 'يرجى إدخال كمية صحيحة';
      return;
    }

    try {
      this.saving = true;
      if (this.rowId) {
        const { error } = await this.sb.rpc('branch_inventory_update', {
          _id: this.rowId,
          _quantity: qty
        });
        if (error) throw error;
      } else {
        if (!this.branch_id || !this.item_id) {
          this.formError = 'يرجى اختيار الفرع والعنصر';
          return;
        }
        const { error } = await this.sb.rpc('branch_inventory_insert', {
          _branch_id: this.branch_id,
          _item_id: this.item_id,
          _quantity: qty
        });
        if (error) throw error;
      }
      this.goBack();
    } catch (e: any) {
      console.error('Error saving stock', e);
      this.formError = e?.message || 'فشل حفظ المخزون';
    } finally {
      this.saving = false;
    }
  }

  goBack() {
    this.router.navigate(['branch-inventory']);
  }
}
