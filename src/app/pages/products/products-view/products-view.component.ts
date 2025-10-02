import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../../core/supabase.service';
import { SpinnerComponent } from '../../../core/ui/components/spinner/spinner.component';
import { ButtonComponent } from '../../../core/ui/components/button/button.component';
import { CardComponent } from '../../../core/ui/components/card/card.component';

interface RecipeRow {
  id: string;
  item_id: string;
  item_name: string;
  quantity: number;
  unit: string | null;
}

@Component({
  selector: 'app-products-view',
  standalone: true,
  imports: [CommonModule, RouterModule, SpinnerComponent, ButtonComponent, CardComponent],
  template: `
    <div class="page-header">
      <div class="header-content">
        <h1>عرض المنتج</h1>
        <p class="page-subtitle" *ngIf="product()">{{ product()?.name }} — سعر البيع: {{ product()?.sale_price }} ج.م</p>
      </div>
      <div class="header-actions">
        <app-button variant="outline" (btnClick)="goBack()">عودة للمنتجات</app-button>
      </div>
    </div>

    <app-spinner *ngIf="loading()" [overlay]="false" message="جاري التحميل..."></app-spinner>

    <div *ngIf="!loading()">
      <app-card [title]="'بيانات المنتج'">
        <div class="details">
          <div class="row"><span class="label">الاسم:</span><span>{{ product()?.name }}</span></div>
          <div class="row"><span class="label">سعر البيع:</span><span>{{ product()?.sale_price }}</span></div>
          <div class="row"><span class="label">سعر الشراء:</span><span>{{ product()?.buy_price }}</span></div>
          <div class="row"><span class="label">متاح؟</span><span>{{ product()?.is_available ? 'نعم' : 'لا' }}</span></div>
        </div>
      </app-card>

      <app-card [title]="'الوصفة (Recipe)'">
        <div class="table-responsive">
          <table class="items-table">
            <thead>
              <tr>
                <th>العنصر</th>
                <th>الكمية</th>
                <th>الوحدة</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of recipes()">
                <td>{{ r.item_name }}</td>
                <td>{{ r.quantity }}</td>
                <td>{{ r.unit || '-' }}</td>
              </tr>
              <tr *ngIf="recipes().length === 0">
                <td colspan="3" class="empty">لا توجد مكونات لهذا المنتج</td>
              </tr>
            </tbody>
          </table>
        </div>
      </app-card>
    </div>
  `,
  styles: [`
    .page-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1rem}
    .page-subtitle{color:var(--muted-text)}
    .details{display:grid;grid-template-columns:repeat(2,1fr);gap:.75rem}
    .row{display:flex;gap:.5rem}
    .label{color:var(--muted-text);min-width:120px}
    .table-responsive{overflow:auto}
    table{width:100%;border-collapse:collapse}
    th,td{padding:12px;border-bottom:1px solid var(--border-color);text-align:right}
    thead th{background:#fafafa}
    .empty{text-align:center;color:var(--muted-text)}
    @media (max-width:768px){.details{grid-template-columns:1fr}}
  `]
})
export class ProductsViewComponent implements OnInit {
  productId = '';
  readonly loading = signal(false);
  readonly product = signal<any | null>(null);
  readonly recipes = signal<RecipeRow[]>([]);

  constructor(private sb: SupabaseService, private route: ActivatedRoute, private router: Router) {}

  async ngOnInit(): Promise<void> {
    this.productId = this.route.snapshot.paramMap.get('id') || '';
    this.loading.set(true);
    try {
      await Promise.all([this.loadProduct(), this.loadRecipes()]);
    } finally {
      this.loading.set(false);
    }
  }

  async loadProduct() {
    try {
      const { data, error } = await this.sb.rpc('products_get_by_id', { p_id: this.productId });
      if (error) throw error;
      if (data) {
        this.product.set(data);
        return;
      }
      // Fallback: some callers may pass prod_id instead of UUID id
      const all = await this.sb.rpc('products_get');
      const list = (all.data as any[]) || [];
      const found = list.find(p => p.id === this.productId || String(p.prod_id) === String(this.productId));
      if (found) this.product.set(found);
      else this.product.set(null);
    } catch (e) {
      console.error('Error loading product', e);
      this.product.set(null);
    }
  }

  async loadRecipes() {
    try {
      const { data, error } = await this.sb.rpc('get_product_recipes', { p_product_id: this.productId });
      if (error) throw error;
      this.recipes.set((data as any[]) || []);
    } catch (e) {
      console.error('Error loading recipes', e);
      this.recipes.set([]);
    }
  }

  goBack() {
    this.router.navigate(['products']);
  }
}
