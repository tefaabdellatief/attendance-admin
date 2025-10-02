import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../../core/supabase.service';
import { SpinnerComponent } from '../../../core/ui/components/spinner/spinner.component';
import { ButtonComponent } from '../../../core/ui/components/button/button.component';
import { CardComponent } from '../../../core/ui/components/card/card.component';

@Component({
  selector: 'app-products-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SpinnerComponent, ButtonComponent, CardComponent],
  template: `
    <div class="page-header">
      <div class="header-content">
        <h1>{{ id ? 'تعديل منتج' : 'إضافة منتج' }}</h1>
        <p class="page-subtitle">{{ id ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد' }}</p>
      </div>
      <app-button variant="outline" (btnClick)="goBack()" [disabled]="saving">← رجوع</app-button>
    </div>

    <app-spinner *ngIf="loading" [overlay]="false" message="جاري التحميل..."></app-spinner>

    <div *ngIf="!loading">
      <app-card [title]="'بيانات المنتج'">
        <form (ngSubmit)="onSubmit()" #form="ngForm" class="prod-form">
          <div class="form-grid">
            <div class="form-group">
              <label for="prod_id">رقم المنتج <span class="required">*</span></label>
              <input id="prod_id" name="prod_id" type="number" min="0" step="1" class="form-control" [(ngModel)]="model.prod_id" required placeholder="أدخل رقم المنتج">
            </div>

            <div class="form-group">
              <label for="name">الاسم <span class="required">*</span></label>
              <input id="name" name="name" type="text" class="form-control" [(ngModel)]="model.name" required placeholder="اسم المنتج">
            </div>

            <div class="form-group">
              <label for="category_id">التصنيف <span class="required">*</span></label>
              <select id="category_id" name="category_id" class="form-control" [(ngModel)]="model.category_id" required>
                <option [ngValue]="null" disabled>اختر التصنيف</option>
                <option *ngFor="let c of categories" [ngValue]="c.id">{{ c.name }}</option>
              </select>
            </div>

            <div class="form-group">
              <label for="sale_price">سعر البيع <span class="required">*</span></label>
              <input id="sale_price" name="sale_price" type="number" step="0.01" min="0" class="form-control" [(ngModel)]="model.sale_price" required placeholder="0.00">
            </div>

            <div class="form-group">
              <label for="buy_price">سعر الشراء <span class="required">*</span></label>
              <input id="buy_price" name="buy_price" type="number" step="0.01" min="0" class="form-control" [(ngModel)]="model.buy_price" required placeholder="0.00">
            </div>

            <div class="form-group checkbox-group">
              <label class="checkbox">
                <input type="checkbox" [(ngModel)]="model.is_available" name="is_available" />
                <span>متاح للبيع؟</span>
              </label>
            </div>
          </div>

          <div class="form-actions">
            <app-button type="submit" variant="primary" [disabled]="saving || !form.form.valid" [loading]="saving">{{ id ? 'حفظ' : 'إضافة' }}</app-button>
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
    .prod-form{max-width:900px;margin:0 auto;padding:0 1rem}
    .form-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1.25rem}
    .form-group{display:flex;flex-direction:column}
    .checkbox-group{justify-content:end}
    label{font-weight:600;margin-bottom:.5rem}
    .form-control{padding:0.75rem 1rem;border:2px solid var(--border-color);border-radius:8px}
    .checkbox{display:flex;align-items:center;gap:.5rem;margin-top:1.95rem}
    .form-actions{display:flex;gap:1rem;justify-content:flex-end;margin-top:1.25rem;padding:1rem;background:#f8f9fa;border:1px solid var(--border-color);border-radius:8px}
    .form-error{margin-top:1rem;color:#c62828;display:flex;gap:.5rem;align-items:center}
    @media (max-width:768px){.form-grid{grid-template-columns:1fr}}
  `]
})
export class ProductsFormComponent implements OnInit {
  id: string | null = null;
  model: any = { prod_id: null, name: '', category_id: null, sale_price: null, buy_price: null, is_available: true };
  categories: any[] = [];
  loading = false;
  saving = false;
  formError = '';

  constructor(private route: ActivatedRoute, private router: Router, private sb: SupabaseService) {}

  async ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id');
    await this.loadCategories();
    if (this.id) {
      await this.load();
    }
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

  async load() {
    try {
      this.loading = true;
      const { data, error } = await this.sb.rpc('products_get_by_id', { p_id: this.id });
      if (error) throw error;
      if (!data) throw new Error('المنتج غير موجود');
      this.model = {
        prod_id: data.prod_id,
        name: data.name,
        category_id: data.category_id,
        sale_price: Number(data.sale_price),
        buy_price: Number(data.buy_price),
        is_available: !!data.is_available
      };
    } catch (e: any) {
      console.error('Error loading product', e);
      this.formError = e?.message || 'فشل تحميل البيانات';
    } finally {
      this.loading = false;
    }
  }

  async onSubmit() {
    this.formError = '';
    const prodId = Number(this.model.prod_id);
    const sale = Number(this.model.sale_price);
    const buy = Number(this.model.buy_price);

    if (!Number.isInteger(prodId) || prodId < 0) {
      this.formError = 'رقم المنتج يجب أن يكون عدداً صحيحاً غير سالب';
      return;
    }
    if (!this.model.name?.trim()) {
      this.formError = 'يرجى إدخال اسم المنتج';
      return;
    }
    if (!this.model.category_id) {
      this.formError = 'يرجى اختيار التصنيف';
      return;
    }
    if (!(sale >= 0) || !(buy >= 0)) {
      this.formError = 'أسعار البيع والشراء يجب أن تكون أرقاماً صحيحة أو عشرية غير سالبة';
      return;
    }

    try {
      this.saving = true;
      if (this.id) {
        const { error } = await this.sb.rpc('products_update', {
          p_id: this.id,
          p_prod_id: prodId,
          p_name: this.model.name.trim(),
          p_category_id: this.model.category_id,
          p_sale_price: sale,
          p_buy_price: buy,
          p_is_available: !!this.model.is_available
        });
        if (error) throw error;
      } else {
        const { error } = await this.sb.rpc('products_insert', {
          p_prod_id: prodId,
          p_name: this.model.name.trim(),
          p_category_id: this.model.category_id,
          p_sale_price: sale,
          p_buy_price: buy,
          p_is_available: !!this.model.is_available
        });
        if (error) throw error;
      }
      this.goBack();
    } catch (e: any) {
      console.error('Error saving product', e);
      this.formError = e?.message || 'فشل حفظ المنتج';
    } finally {
      this.saving = false;
    }
  }

  goBack() {
    this.router.navigate(['products']);
  }
}
