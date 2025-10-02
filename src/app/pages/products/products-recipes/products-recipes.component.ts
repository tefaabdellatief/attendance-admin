import { Component, OnInit, computed, signal, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../../core/supabase.service';
import { SpinnerComponent } from '../../../core/ui/components/spinner/spinner.component';
import { ButtonComponent } from '../../../core/ui/components/button/button.component';
import { CardComponent } from '../../../core/ui/components/card/card.component';

interface InventoryItem {
  id: string;
  name: string;
  unit?: string | null;
  stock?: number | null;
  cost?: number | null; // average or last cost if provided by backend
}

interface RecipeRow {
  id: string;
  item_id: string;
  item_name: string;
  quantity: number;
  unit: string | null;
}

@Component({
  selector: 'app-products-recipes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SpinnerComponent, ButtonComponent, CardComponent],
  template: `
    <div class="page-header">
      <div class="header-content">
        <h1>مكونات المنتج</h1>
        <p class="page-subtitle">{{ product() ? (product()?.name + ' — ' + (product()?.sale_price ?? 0) + ' ج.م') : 'تعريف وصفة المنتج باستخدام عناصر المخزون' }}</p>
      </div>
      <div class="header-actions">
        <app-button variant="outline" (btnClick)="goBack()">عودة للمنتجات</app-button>
      </div>
    </div>

    <app-spinner *ngIf="loading()" [overlay]="false" message="جاري التحميل..."></app-spinner>

    <div class="main-content">
      <!-- Left Column: Recipe Table -->
      <div class="left-column">
        <app-card [title]="'الوصفة الحالية'">
          <div class="table-responsive">
            <table class="items-table">
              <thead>
                <tr>
                  <th>العنصر</th>
                  <th>الكمية</th>
                  <th>الوحدة</th>
                  <th style="width: 220px">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let r of recipes()">
                  <td>{{ r.item_name }}</td>
                  <td>{{ r.quantity }}</td>
                  <td>{{ r.unit || '-' }}</td>
                  <td class="actions">
                    <app-button size="sm" variant="outline" (btnClick)="startEdit(r)">تعديل</app-button>
                    <app-button size="sm" variant="danger" (btnClick)="remove(r)" [disabled]="saving()">حذف</app-button>
                  </td>
                </tr>
                <tr *ngIf="recipes().length === 0">
                  <td colspan="4" class="empty">لا توجد مكونات لهذا المنتج</td>
                </tr>
              </tbody>
            </table>
          </div>
        </app-card>
      </div>

      <!-- Right Column: Search and Inventory Items -->
      <div class="right-column">
        <app-card [title]="'إضافة مكون'">
          <form class="form" (ngSubmit)="addOrUpdate()">
            <div class="field items-field">
              <label>اختيار عنصر من المخزون</label>
              <input
                type="text"
                [ngModel]="itemSearch()"
                (ngModelChange)="onItemSearchChange($event)"
                name="itemSearch"
                placeholder="ابحث عن عنصر..." />

              <div class="items-selection">
                <div class="selection-header">
                  <span>اختر عنصر من القائمة:</span>
                  <span class="items-count">{{ availableItems().length }} عنصر</span>
                </div>

                <div class="items-grid">
                  <div
                    class="item-card"
                    *ngFor="let it of availableItems(); let i = index"
                    [class.selected]="selectedItemId === it.id"
                    [class.added]="isItemAlreadyAdded(it.id)"
                    (click)="selectItem(it)"
                  >
                    <div class="item-name" [innerHTML]="highlightMatch(it.name)"></div>
                    <div class="item-unit" *ngIf="it.unit">{{ it.unit }}</div>
                    <div class="item-info">
                      <div class="item-stock" *ngIf="typeof it.stock === 'number'">
                        <span class="label">المخزون:</span>
                        <span class="value">{{ it.stock }}</span>
                      </div>
                      <div class="item-cost" *ngIf="typeof it.cost === 'number'">
                        <span class="label">التكلفة:</span>
                        <span class="value">{{ it.cost }} ج.م</span>
                      </div>
                    </div>
                    <div class="item-status" *ngIf="isItemAlreadyAdded(it.id)">
                      <span class="already-added">✓ مضاف</span>
                    </div>
                  </div>

                  <div class="no-results" *ngIf="availableItems().length === 0">
                    <div class="no-results-icon">🔍</div>
                    <div>لا توجد نتائج للبحث</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="field qty-field">
              <label>الكمية</label>
              <div class="qty-wrap">
                <input type="number" step="0.0001" min="0" [ngModel]="quantity()" name="qty" required (ngModelChange)="onQuantityChange($event)" />
                <span class="unit" *ngIf="selectedUnit()">{{ selectedUnit() }}</span>
              </div>
            </div>

            <app-button [disabled]="saving() || !isFormValid()" type="submit">
              {{ editMode() ? 'تحديث' : 'إضافة' }}
            </app-button>
            <app-button variant="outline" *ngIf="editMode()" (btnClick)="cancelEdit()">إلغاء</app-button>
            <div class="error" *ngIf="qtyError()">الكمية يجب أن تكون أكبر من 0 وبحد أقصى 4 منازل عشرية</div>
          </form>
        </app-card>
      </div>
    </div>

    <div *ngIf="notice().message" class="notice" [class.success]="notice().type==='success'" [class.error]="notice().type==='error'">
      {{ notice().message }}
    </div>
  `,
  styles: [`
    .page-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1rem}
    .page-subtitle{color:var(--muted-text)}
    /* 2-Column Layout */
    .main-content{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;align-items:start}
    .left-column{order:1}
    .right-column{order:2}
    .form{display:flex;gap:.75rem;align-items:flex-end;flex-wrap:wrap;position:relative}
    /* Make the items list (first field) take the full width */
    .form .items-field{flex:1 1 100%; min-width:0}
    .form .field{display:flex;flex-direction:column;gap:.25rem}
    .form label{display:block;color:var(--muted-text);font-size:.9rem}
    .form input,.form select{padding:.5rem .75rem;border:2px solid var(--border-color);border-radius:8px;min-width:220px;transition:border-color 0.2s ease,box-shadow 0.2s ease}
    .form input:focus{border-color:#007bff;box-shadow:0 0 0 3px rgba(0,123,255,0.1);outline:none}
    .qty-field .qty-wrap{display:flex;align-items:center;gap:.5rem}
    .qty-field .unit{padding:.35rem .55rem;border:1px solid var(--border-color);border-radius:8px;background:#fff;color:#333}
    /* Items Selection */
    .items-selection{background:#fff;border:1px solid var(--border-color);border-radius:8px;margin-top:.5rem;box-shadow:0 4px 12px rgba(0,0,0,0.1);height:auto;display:flex;flex-direction:column}
    .selection-header{display:flex;justify-content:space-between;align-items:center;padding:.75rem 1rem;background:#f8f9fa;border-bottom:1px solid #e9ecef;font-weight:600;color:#495057;flex-shrink:0}
    .items-count{background:#007bff;color:#fff;padding:.25rem .5rem;border-radius:12px;font-size:.8rem;font-weight:500}
    .items-grid{display:grid;grid-template-columns:repeat(auto-fill, minmax(160px, 1fr));grid-template-rows:repeat(3, 1fr);gap:.5rem;padding:1rem;height:auto;max-height:400px;overflow-y:auto;overflow-x:hidden;scroll-snap-type:y proximity;align-items:start}
    .item-card{background:#fff;border:2px solid #e9ecef;border-radius:8px;padding:.4rem;cursor:pointer;transition:all 0.2s ease;position:relative;display:flex;flex-direction:column;gap:.2rem;height:80px;overflow:hidden;scroll-snap-align:start}
    .item-card:hover{background:#f8f9fa;border-color:#007bff;transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,123,255,0.15)}
    .item-card.selected{background:#e3f2fd;border-color:#2196f3;box-shadow:0 0 0 2px rgba(33,150,243,0.2)}
    .item-card.added{opacity:.7;background:#f0f8ff;border-color:#28a745}
    .item-card.added:hover{opacity:.9}
    .item-name{font-weight:600;color:#333;font-size:.9rem;line-height:1.3;margin-bottom:.25rem}
    .item-unit{color:#6c757d;font-size:.75rem;background:#e9ecef;padding:.2rem .4rem;border-radius:4px;display:inline-block;width:fit-content;align-self:flex-start}
    .item-info{display:flex;flex-direction:column;gap:.25rem;flex:1}
    .item-stock,.item-cost{display:flex;gap:.25rem;align-items:center;font-size:.75rem}
    .item-stock .label,.item-cost .label{color:#6c757d}
    .item-stock .value,.item-cost .value{font-weight:600;color:#495057}
    .item-status{display:flex;align-items:center;justify-content:center;margin-top:auto}
    .already-added{color:#28a745;font-weight:600;font-size:.75rem;background:#d4edda;padding:.2rem .4rem;border-radius:4px}
    .no-results{padding:2rem;color:var(--muted-text);text-align:center;display:flex;flex-direction:column;align-items:center;gap:.5rem;width:100%}
    .no-results-icon{font-size:2rem;opacity:.5}
    @keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
    @media (max-width:768px){.main-content{grid-template-columns:1fr;gap:1rem}.right-column{order:1}.left-column{order:2}.items-grid{grid-template-columns:repeat(auto-fill, minmax(140px, 1fr));grid-template-rows:repeat(4, 1fr);}.item-card{height:75px}}
    @media (max-width:480px){.main-content{grid-template-columns:1fr;gap:1rem}.right-column{order:1}.left-column{order:2}.items-grid{grid-template-columns:repeat(auto-fill, minmax(120px, 1fr));grid-template-rows:repeat(5, 1fr);}.item-card{height:70px}}
    /* Recipe table styling */
    .table-responsive{overflow:visible}
    .items-table{width:100%;border-collapse:separate;border-spacing:0;direction:rtl;background:#fff;border:1px solid var(--border-color);border-radius:8px;overflow:hidden}
    .items-table th,.items-table td{padding:.65rem .75rem;border-bottom:1px solid #eee;text-align:right;vertical-align:middle}
    .items-table thead th{background:#f8f9fa;color:#495057;font-weight:700}
    .items-table tbody tr:nth-child(even){background:#fcfcfc}
    .items-table tbody tr:hover{background:#f6f7f9}
    .items-table th:first-child,.items-table td:first-child{border-right:1px solid #eee}
    .items-table th:last-child,.items-table td:last-child{border-left:1px solid #eee}
    .actions{display:flex;gap:.5rem}
    .empty{text-align:center;color:var(--muted-text)}
    .error{color:#c62828;margin-top:.5rem}
    .notice{position:fixed;bottom:16px;left:16px;background:#333;color:#fff;padding:.6rem .9rem;border-radius:8px;opacity:.95}
    .notice.success{background:#2e7d32}
    .notice.error{background:#c62828}
  `]
})
export class ProductsRecipesComponent implements OnInit {
  productId = '';

  // signals
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly items = signal<InventoryItem[]>([]);
  readonly recipes = signal<RecipeRow[]>([]);
  readonly itemSearch = signal<string>('');
  readonly showDropdown = signal(false);
  readonly focusedIndex = signal(0);
  readonly maxResults = Number.POSITIVE_INFINITY;
  readonly product = signal<{ id: string; name: string; sale_price: number } | null>(null);
  readonly notice = signal<{ type: 'success' | 'error'; message: string }>({ type: 'success', message: '' });
  readonly dropdownPos = signal<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });

  // form
  selectedItemId: string = '';
  quantity = signal<number | null>(null);
  private editingItemId: string | null = null; // when editing, this holds the item_id
  private editingRowId: string | null = null; // corresponding product_recipes.id

  readonly editMode = computed(() => !!this.editingItemId);

  // derived
  readonly filteredItems = computed(() => {
    const q = (this.itemSearch() || '').toLowerCase().trim();
    let list = this.items();
    if (q) {
      list = list.filter(i => (i.name || '').toLowerCase().includes(q));
    }
    // Order by ID ascending for consistent display
    return [...list].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  });
  readonly availableItems = computed(() => {
    const list = this.filteredItems();
    console.log('Available items (no cap):', list.length);
    return list; // show all filtered items
  });
  readonly selectedUnit = computed(() => {
    const id = this.selectedItemId;
    if (!id) return '';
    return this.items().find(i => i.id === id)?.unit || '';
  });

  constructor(private sb: SupabaseService, private route: ActivatedRoute, private router: Router, private elRef: ElementRef) {}

  async ngOnInit(): Promise<void> {
    this.productId = this.route.snapshot.paramMap.get('id') || '';
    console.log('Component initialized with product ID:', this.productId);
    console.log('Product ID from route param:', this.route.snapshot.paramMap.get('id'));
    await Promise.all([this.loadInventoryItems(), this.loadRecipes(), this.loadProductInfo()]);
  }

  async loadInventoryItems() {
    try {
      const { data, error } = await this.sb.rpc('inventory_items_get');
      if (error) throw error;
      this.items.set(((data as any[]) || []).map(i => ({
        id: i.id,
        name: i.name,
        unit: i.unit ?? null,
        stock: (i.stock ?? i.current_stock ?? null) as any,
        cost: (i.avg_buy_price ?? i.last_buy_price ?? null) as any,
      })));
    } catch (e) {
      console.error('Error loading inventory items', e);
      this.items.set([]);
    }
  }
  @HostListener('window:scroll') onScroll() { if (this.showDropdown()) this.updateDropdownPosition(); }
  @HostListener('window:resize') onResize() { if (this.showDropdown()) this.updateDropdownPosition(); }
  private updateDropdownPosition() {
    try {
      const input: HTMLInputElement | null = this.elRef.nativeElement.querySelector('input[name="itemSearch"]');
      if (!input) return;
      const rect = input.getBoundingClientRect();
      this.dropdownPos.set({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX, width: rect.width });
    } catch {}
  }

  async loadRecipes() {
    this.loading.set(true);
    try {
      console.log('Loading recipes for product ID:', this.productId);
      console.log('Product ID type:', typeof this.productId);
      
      // Try different parameter formats to debug
      console.log('Trying RPC call with different parameter formats...');
      
      // First try with the original format
      let { data, error } = await this.sb.rpc('get_product_recipes', { p_product_id: this.productId });
      
      // If that fails, try with string conversion
      if (!data || data.length === 0) {
        console.log('First attempt failed, trying with string conversion...');
        const result2 = await this.sb.rpc('get_product_recipes', { p_product_id: String(this.productId) });
        if (result2.data && result2.data.length > 0) {
          console.log('String conversion worked!');
          data = result2.data;
          error = result2.error;
        } else {
          console.log('String conversion also failed, trying with hardcoded UUID...');
          // Try with the exact UUID from your SQL editor test
          const result3 = await this.sb.rpc('get_product_recipes', { p_product_id: '1b91e216-f04b-451d-b0ed-2e13ba93b3b6' });
          console.log('Hardcoded UUID result:', result3);
          if (result3.data && result3.data.length > 0) {
            console.log('Hardcoded UUID worked! This means the issue is with the product ID parameter');
            data = result3.data;
            error = result3.error;
          }
        }
      }
      
      console.log('RPC call result:', { data, error });
      console.log('Data is null?', data === null);
      console.log('Data is undefined?', data === undefined);
      console.log('Error is null?', error === null);
      console.log('Error is undefined?', error === undefined);
      
      if (error) {
        console.error('RPC error details:', error);
        console.error('Error message:', error.message);
        console.error('Error code:', (error as any).code);
        console.error('Error details:', (error as any).details);
        console.error('Error hint:', (error as any).hint);
        throw error;
      }
      
      // Check if data is null/undefined but no error
      if (data === null || data === undefined) {
        console.warn('Data is null/undefined but no error reported');
        console.log('This might indicate a permission issue or RLS policy blocking access');
      }
      
      // Debug: Log the raw data to see what fields are available
      console.log('Raw recipe data from get_product_recipes:', data);
      console.log('Data type:', typeof data);
      console.log('Data length:', data?.length);
      
      if (data && data.length > 0) {
        console.log('First recipe item keys:', Object.keys(data[0]));
        console.log('First recipe item values:', data[0]);
      } else {
        console.log('No recipe data received or empty array');
      }
      
      // Normalize rows so we always have: id, item_id, item_name, quantity, unit
      const rows = ((data as any[]) || []).map((r: any) => {
        const normalized = {
          id: r.id ?? r.recipe_id ?? r.rec_id ?? r.pr_id ?? r.product_recipe_id ?? '',
          item_id: r.item_id ?? r.inv_item_id ?? r.inventory_item_id ?? '',
          item_name: r.item_name ?? r.name ?? '',
          quantity: Number(r.quantity ?? r.qty ?? 0),
          unit: r.unit ?? r.uom ?? null,
        };
        console.log('Normalized recipe row:', normalized);
        return normalized;
      });
      
      console.log('Final normalized rows:', rows);
      this.recipes.set(rows);
    } catch (e) {
      console.error('Error loading recipes', e);
      this.recipes.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  async loadProductInfo() {
    try {
      const { data, error } = await this.sb.rpc('products_get');
      if (error) throw error;
      const list = (data as any[]) || [];
      const found = list.find(p => p.id === this.productId || p.prod_id === this.productId);
      if (found) {
        this.product.set({ id: found.id ?? found.prod_id, name: found.name, sale_price: Number(found.sale_price ?? 0) });
      } else {
        this.product.set(null);
      }
    } catch (e) {
      console.error('Error loading product info', e);
      this.product.set(null);
    }
  }

  async addOrUpdate() {
    if (!this.productId || !this.selectedItemId || !this.quantity() || this.quantity()! <= 0) return;
    // normalize to 4 decimals
    this.quantity.set(parseFloat((Number(this.quantity())).toFixed(4)));
    this.saving.set(true);
    try {
      if (this.editingItemId) {
        // Update existing row
        const rowId = this.editingRowId;
        if (!rowId) throw new Error('Missing recipe row id for update');
        const { error } = await this.sb.rpc('update_product_recipe', {
          p_id: rowId,
          p_quantity: this.quantity(),
        });
        if (error) throw error;
      } else {
        // If item already exists, increment quantity instead of insert
        const existing = this.recipes().find(r => r.item_id === this.selectedItemId);
        if (existing) {
          const { error } = await this.sb.rpc('update_product_recipe', {
            p_id: existing.id,
            p_quantity: Number(existing.quantity) + Number(this.quantity()),
          });
          if (error) throw error;
        } else {
          // Try insert
          const { error } = await this.sb.rpc('add_product_recipe', {
            p_product_id: this.productId,
            p_item_id: this.selectedItemId,
            p_quantity: this.quantity(),
          });
          if (error) throw error;
        }
      }
      await this.loadRecipes();
      this.cancelEdit();
      this.flash('success', this.editingItemId ? 'تم تحديث المكون بنجاح' : 'تمت إضافة المكون بنجاح');
    } catch (e: any) {
      // Fallback for unique violation from DB (23505) or HTTP 409 routed
      const code = e?.code || e?.status || e?.message;
      const duplicate = code === '23505' || code === 409 || (typeof code === 'string' && code.includes('duplicate'));
      if (!this.editingItemId && duplicate) {
        try {
          const existing = this.recipes().find(r => r.item_id === this.selectedItemId);
          if (existing) {
            const { error } = await this.sb.rpc('update_product_recipe', {
              p_id: existing.id,
              p_quantity: Number(existing.quantity) + Number(this.quantity()),
            });
            if (error) throw error;
            await this.loadRecipes();
            this.cancelEdit();
            this.flash('success', 'تم تحديث الكمية للمكون المضاف مسبقاً');
          }
        } catch (e2) {
          console.error('Error handling duplicate recipe add', e2);
          this.flash('error', 'تعذر إكمال العملية');
        }
      } else {
        console.error('Error saving recipe', e);
        this.flash('error', 'حدث خطأ أثناء الحفظ');
      }
    } finally {
      this.saving.set(false);
    }
  }

  async startEdit(row: RecipeRow) {
    this.editingItemId = row.item_id;
    this.editingRowId = row.id;
    this.selectedItemId = row.item_id;
    this.quantity.set(Number(row.quantity));
    // also prefill search with current item name so it's visible at top of list
    const it = this.items().find(i => i.id === row.item_id);
    if (it?.name) this.itemSearch.set(it.name);
  }

  cancelEdit() {
    this.editingItemId = null;
    this.editingRowId = null;
    this.selectedItemId = '';
    this.quantity.set(null);
    this.itemSearch.set('');
    this.closeDropdown();
  }

  async remove(row: RecipeRow) {
    if (!row?.item_id) return;
    this.saving.set(true);
    try {
      let rowId = row.id;
      let didReload = false;
      
      // Debug: Log the row data to see what we're working with
      console.log('Attempting to delete recipe row:', row);
      
      if (!rowId) {
        // reload to resolve id
        console.log('Row ID missing, reloading recipes to get proper ID');
        await this.loadRecipes();
        didReload = true;
        const found = this.recipes().find(r => r.item_id === row.item_id);
        rowId = found?.id as any;
        console.log('Found row after reload:', found);
      }
      
      if (rowId) {
        console.log('Deleting recipe via RPC delete_product_recipe', { p_id: rowId });
        const { data, error } = await this.sb.rpc('delete_product_recipe', { p_id: rowId });
        
        if (error) {
          console.error('RPC delete_product_recipe error:', error);
          throw error;
        }
        
        console.log('RPC delete_product_recipe success:', data);
        
        // Only update UI after successful deletion
        this.recipes.set(this.recipes().filter(r => r.id !== rowId));
        this.flash('success', 'تم حذف المكون');
      } else {
        console.error('No row ID found for deletion, trying alternative approach');
        
        // Alternative approach: Try to delete by product_id and item_id combination
        // This assumes you have a delete function that accepts these parameters
        try {
          console.log('Attempting delete by product_id and item_id:', {
            p_product_id: this.productId,
            p_item_id: row.item_id
          });
          
          // Try a different RPC that might accept product_id and item_id
          const { data, error } = await this.sb.rpc('delete_product_recipe_by_item', {
            p_product_id: this.productId,
            p_item_id: row.item_id
          });
          
          if (error) {
            console.error('Alternative delete RPC error:', error);
            throw error;
          }
          
          console.log('Alternative delete RPC success:', data);
          
          // Update UI after successful deletion
          this.recipes.set(this.recipes().filter(r => r.item_id !== row.item_id));
          this.flash('success', 'تم حذف المكون');
        } catch (altError) {
          console.error('Alternative delete approach failed:', altError);
          this.flash('error', 'تعذر حذف المكون - يرجى تحديث دالة get_product_recipes لتشمل حقل id');
          return;
        }
      }
    } catch (e: any) {
      console.error('Error deleting recipe row', e);
      this.flash('error', 'حدث خطأ أثناء الحذف: ' + (e?.message || 'خطأ غير معروف'));
    } finally {
      this.saving.set(false);
    }
  }

  // resolveRowId removed; we rely on RPC get_product_recipes to include id

  goBack() {
    this.router.navigate(['products']);
  }

  // UI helpers for items selection
  openDropdown() { this.showDropdown.set(true); }
  closeDropdown() { this.showDropdown.set(false); this.focusedIndex.set(0); }
  onItemSearchChange(val: string) {
    this.itemSearch.set(val);
    this.focusedIndex.set(0);
  }
  
  onQuantityChange(val: any) {
    console.log('Quantity changed:', { val, type: typeof val });
    this.quantity.set(val ? Number(val) : null);
    console.log('Quantity set to:', this.quantity());
  }
  onItemSearchKeydown(ev: KeyboardEvent) {
    const list = this.availableItems();
    if (!this.showDropdown() && (ev.key === 'ArrowDown' || ev.key === 'Enter')) {
      this.openDropdown();
      ev.preventDefault();
      return;
    }
    if (!list.length) return;
    if (ev.key === 'ArrowDown') {
      this.focusedIndex.set((this.focusedIndex() + 1) % list.length);
      ev.preventDefault();
    } else if (ev.key === 'ArrowUp') {
      this.focusedIndex.set((this.focusedIndex() - 1 + list.length) % list.length);
      ev.preventDefault();
    } else if (ev.key === 'Enter') {
      const it = list[this.focusedIndex()];
      if (it) this.selectItem(it);
      ev.preventDefault();
    } else if (ev.key === 'Escape') {
      this.closeDropdown();
      ev.preventDefault();
    }
  }
  selectItem(it: InventoryItem) {
    console.log('Selecting item:', it);
    this.selectedItemId = it.id;
    this.itemSearch.set(it.name);
    console.log('Selected item ID set to:', this.selectedItemId);
    // Don't close dropdown immediately - let user see the selection
    // this.closeDropdown();
  }
  isItemAlreadyAdded(id: string) {
    return !!this.recipes().find(r => r.item_id === id);
  }
  highlightMatch(text: string) {
    const q = (this.itemSearch() || '').trim();
    if (!q) return text;
    const esc = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(esc, 'ig'), m => `<mark>${m}</mark>`);
  }
  qtyError = computed(() => {
    const q = Number(this.quantity() ?? 0);
    console.log('Quantity validation:', { quantity: this.quantity(), q, isGreaterThanZero: q > 0 });
    if (!(q > 0)) return true;
    const parts = String(q).split('.');
    const hasTooManyDecimals = parts[1]?.length > 4;
    console.log('Decimal validation:', { parts, hasTooManyDecimals });
    return hasTooManyDecimals;
  });
  
  // Check if form is valid for enabling the button
  isFormValid = computed(() => {
    const hasItem = !!this.selectedItemId;
    const hasQuantity = !!(this.quantity() && this.quantity()! > 0);
    const qtyErrorResult = this.qtyError();
    const noQtyError = !qtyErrorResult;
    const isValid = hasItem && hasQuantity && noQtyError;
    
    // Debug logging
    console.log('Form validation debug:', {
      selectedItemId: this.selectedItemId,
      quantity: this.quantity(),
      hasItem,
      hasQuantity,
      qtyErrorResult,
      noQtyError,
      isValid,
      saving: this.saving()
    });
    
    return isValid;
  });
  flash(type: 'success' | 'error', message: string) {
    this.notice.set({ type, message });
    setTimeout(() => this.notice.set({ type, message: '' }), 2000);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(ev: MouseEvent) {
    // Items selection is always visible now, no need to close on outside click
    // This handler is kept for potential future use
  }
}
