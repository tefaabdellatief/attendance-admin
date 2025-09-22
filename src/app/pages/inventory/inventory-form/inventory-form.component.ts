import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../../core/supabase.service';
import { SpinnerComponent } from '../../../core/ui/components/spinner/spinner.component';
import { ButtonComponent } from '../../../core/ui/components/button/button.component';
import { CardComponent } from '../../../core/ui/components/card/card.component';

@Component({
  selector: 'app-inventory-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SpinnerComponent, ButtonComponent, CardComponent],
  template: `
    <div class="page-header">
      <div class="header-content">
        <h1>{{ itemId ? 'تعديل عنصر مخزون' : 'إضافة عنصر مخزون' }}</h1>
        <p class="page-subtitle">{{ itemId ? 'تعديل بيانات عنصر المخزون' : 'إضافة عنصر جديد إلى المخزون' }}</p>
      </div>
      <app-button variant="outline" (btnClick)="goBack()" [disabled]="saving">← رجوع</app-button>
    </div>

    <app-spinner *ngIf="loading" [overlay]="false" message="جاري التحميل..."></app-spinner>

    <div *ngIf="!loading">
      <app-card [title]="'بيانات العنصر'" [subtitle]="'أدخل تفاصيل عنصر المخزون'">
        <form (ngSubmit)="onSubmit()" #form="ngForm" class="item-form">
          <div class="form-grid">
            <div class="form-group">
              <label for="name">الاسم <span class="required">*</span></label>
              <input id="name" name="name" type="text" class="form-control" [(ngModel)]="item.name" required placeholder="أدخل اسم العنصر">
            </div>

            <div class="form-group">
              <label for="unit">الوحدة <span class="required">*</span></label>
              <input id="unit" name="unit" type="text" class="form-control" [(ngModel)]="item.unit" required placeholder="مثال: kg, piece, box">
            </div>

            <div class="form-group full-width">
              <label for="description">الوصف</label>
              <textarea id="description" name="description" class="form-control" [(ngModel)]="item.description" rows="4" placeholder="أدخل وصفاً اختيارياً"></textarea>
            </div>
          </div>

          <div class="form-actions">
            <app-button type="submit" variant="primary" [disabled]="saving || !form.form.valid" [loading]="saving">{{ itemId ? 'حفظ التغييرات' : 'إضافة العنصر' }}</app-button>
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
    .item-form{max-width:900px;margin:0 auto;padding:0 1rem}
    .form-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1.5rem}
    .form-group{display:flex;flex-direction:column}
    .form-group.full-width{grid-column:1 / -1}
    label{font-weight:600;margin-bottom:.5rem}
    .form-control{padding:0.75rem 1rem;border:2px solid var(--border-color);border-radius:8px}
    .form-actions{display:flex;gap:1rem;justify-content:flex-end;margin-top:1.5rem;padding:1rem;background:#f8f9fa;border:1px solid var(--border-color);border-radius:8px}
    .form-error{margin-top:1rem;color:#c62828;display:flex;gap:.5rem;align-items:center}
    @media (max-width:768px){.form-grid{grid-template-columns:1fr}}
  `]
})
export class InventoryFormComponent implements OnInit {
  item: any = { name: '', unit: '', description: '' };
  itemId: string | null = null;
  loading = false;
  saving = false;
  formError = '';

  constructor(private route: ActivatedRoute, private router: Router, private sb: SupabaseService) {}

  async ngOnInit() {
    this.itemId = this.route.snapshot.paramMap.get('id');
    if (this.itemId) {
      await this.loadItem();
    }
  }

  async loadItem() {
    try {
      this.loading = true;
      const { data, error } = await this.sb.rpc('inventory_items_get_by_id', { _id: this.itemId });
      if (error) throw error;
      if (!data) throw new Error('العنصر غير موجود');
      this.item = { name: data.name, unit: data.unit, description: data.description };
    } catch (e: any) {
      console.error('Error loading item', e);
      this.formError = e?.message || 'فشل تحميل بيانات العنصر';
    } finally {
      this.loading = false;
    }
  }

  async onSubmit() {
    this.formError = '';
    if (!this.item.name?.trim() || !this.item.unit?.trim()) {
      this.formError = 'يرجى إدخال الاسم والوحدة';
      return;
    }

    try {
      this.saving = true;
      if (this.itemId) {
        const { error } = await this.sb.rpc('inventory_items_update', {
          _id: this.itemId,
          _name: this.item.name.trim(),
          _unit: this.item.unit.trim(),
          _description: this.item.description?.trim() || null
        });
        if (error) throw error;
      } else {
        const { error } = await this.sb.rpc('inventory_items_insert', {
          _name: this.item.name.trim(),
          _unit: this.item.unit.trim(),
          _description: this.item.description?.trim() || null
        });
        if (error) throw error;
      }
      this.goBack();
    } catch (e: any) {
      console.error('Error saving item', e);
      this.formError = e?.message || 'فشل حفظ العنصر';
    } finally {
      this.saving = false;
    }
  }

  goBack() {
    this.router.navigate(['inventory']);
  }
}
