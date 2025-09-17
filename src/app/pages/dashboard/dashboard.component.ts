import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../core/supabase.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="cards">
      <div class="card primary">
        <div class="card-icon">🧑‍🍳</div>
        <div class="card-content">
          <div class="title">الموظفون العاملون اليوم</div>
          <div class="value">{{ stats?.employees_worked_today ?? 0 }}</div>
        </div>
      </div>

      <div class="card info">
        <div class="card-icon">🟢</div>
        <div class="card-content">
          <div class="title">يعملون الآن</div>
          <div class="value">{{ stats?.currently_working ?? 0 }}</div>
        </div>
      </div>

      <div class="card success">
        <div class="card-icon">💰</div>
        <div class="card-content">
          <div class="title">إجمالي المكافآت اليوم</div>
          <div class="value">{{ stats?.additions_today | number:'1.2-2' }}</div>
        </div>
      </div>

      <div class="card danger">
        <div class="card-icon">💸</div>
        <div class="card-content">
          <div class="title">إجمالي الخصومات اليوم</div>
          <div class="value">{{ stats?.deductions_today | number:'1.2-2' }}</div>
        </div>
      </div>
    </section>

    <section class="panel">
      <h3>عدد الموظفين لكل فرع اليوم</h3>
      <div class="branch-cards">
        <div class="branch-card" 
             *ngFor="let b of stats?.employees_per_branch_today || []; let i = index" 
             [ngClass]="gradientClass(i)"
             (click)="goToBranch(b)">
          <div class="branch-card__header">
            <div class="branch-card__icon">{{ branchEmoji(i, b.branch_name) }}</div>
            <div class="branch-card__badge" title="عدد الموظفين اليوم">{{ b.employees_count }}</div>
          </div>
          <div class="branch-card__content">
            <div class="branch-card__title">{{ b.branch_name }}</div>
            <div class="branch-card__subtitle">موظفون يعملون اليوم</div>
          </div>
          <div class="branch-card__actions">
            <button class="action-btn" (click)="goToBranch(b); $event.stopPropagation();" title="فتح الفرع">الفرع</button>
            <button class="action-btn outline" (click)="goToAttendance(b); $event.stopPropagation();" title="سجلات الحضور">الحضور</button>
          </div>
        </div>
      </div>
    </section>

    <div *ngIf="loading" class="loading">جاري التحميل...</div>
    <div *ngIf="error" class="error">{{ error }}</div>
  `,
  styles: [`
    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 24px;
      margin-bottom: 24px;
    }
    .card { display:flex; gap:16px; align-items:center; padding:20px; border-radius:14px; color:#fff; }
    .card .card-icon { font-size:40px; line-height:1; }
    .card .title { color:#fff; opacity:.95; font-size:14px; font-weight:600; }
    .card .value { font-size:34px; font-weight:800; }
    .card.primary { background: linear-gradient(135deg,#4e54c8,#8f94fb); }
    .card.info { background: linear-gradient(135deg,#36d1dc,#5b86e5); }
    .card.success { background: linear-gradient(135deg,#11998e,#38ef7d); }
    .card.danger { background: linear-gradient(135deg,#cb356b,#bd3f32); }
    .panel { background:#fff; border-radius:12px; padding:16px; box-shadow:0 4px 12px rgba(0,0,0,.06); }
    .panel h3 { margin:0 0 16px; color:#333; }
    .branch-cards { 
      display: grid; 
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px; 
    }
    .branch-card {
      position: relative;
      border-radius: 14px;
      padding: 16px;
      color: #fff;
      overflow: hidden;
      box-shadow: 0 8px 20px rgba(0,0,0,0.12);
      transform: translateY(0);
      transition: transform .2s ease, box-shadow .2s ease;
      isolation: isolate;
    }
    .branch-card::after {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(120px 120px at 85% -10%, rgba(255,255,255,.35), transparent 60%);
      pointer-events: none;
      z-index: 0;
    }
    .branch-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 28px rgba(0,0,0,0.18);
    }
    .branch-card__header { display:flex; justify-content:space-between; align-items:center; margin-bottom: 10px; position: relative; z-index: 1; }
    .branch-card__icon { font-size: 28px; line-height: 1; }
    .branch-card__badge { background: rgba(255,255,255,0.25); border: 1px solid rgba(255,255,255,0.35); border-radius: 999px; padding: 4px 10px; font-weight: 700; }
    .branch-card__content { position: relative; z-index: 1; }
    .branch-card__title { font-size: 18px; font-weight: 800; margin-bottom: 2px; }
    .branch-card__subtitle { font-size: 12px; opacity: .9; }
    .branch-card__actions { display:flex; gap:8px; margin-top: 12px; position: relative; z-index: 1; }
    .action-btn { 
      appearance: none; border: 0; cursor: pointer; 
      background: rgba(255,255,255,0.9); color: #333; 
      padding: 6px 10px; border-radius: 10px; font-weight: 700; font-size: 12px;
      transition: transform .15s ease, background .15s ease;
    }
    .action-btn:hover { transform: translateY(-1px); background: #fff; }
    .action-btn.outline { background: transparent; color: #fff; border: 1px solid rgba(255,255,255,0.7); }

    /* Gradient palettes */
    .grad-0 { background: linear-gradient(135deg,#4e54c8,#8f94fb); }
    .grad-1 { background: linear-gradient(135deg,#36d1dc,#5b86e5); }
    .grad-2 { background: linear-gradient(135deg,#11998e,#38ef7d); }
    .grad-3 { background: linear-gradient(135deg,#ff512f,#dd2476); }
    .grad-4 { background: linear-gradient(135deg,#f7971e,#ffd200); }
    .grad-5 { background: linear-gradient(135deg,#833ab4,#fd1d1d); }
    .loading { margin-top:8px; color:#555; }
    .error { margin-top:8px; color:#b00020; }
  `],
})
export class DashboardComponent implements OnInit {
  stats: {
    employees_worked_today: number;
    employees_per_branch_today: Array<{ branch_id: string; branch_name: string; employees_count: number }>;
    deductions_today: number;
    additions_today: number;
    currently_working: number;
  } | null = null;
  loading = false;
  error = '';

  constructor(private sb: SupabaseService, private router: Router) {}

  async ngOnInit() {
    await this.loadStats();
  }

  async loadStats() {
    this.loading = true;
    this.error = '';
    try {
      const { data, error } = await this.sb.rpc('get_dashboard_stats');
      if (error) throw error;
      // Support response shapes: direct object OR array like [{ get_dashboard_stats: {...} }]
      let result: any = data;
      if (Array.isArray(data)) {
        const first = data[0] as any;
        result = first?.get_dashboard_stats ?? first ?? null;
      }
      this.stats = result as any;
    } catch (e: any) {
      this.error = e?.message || 'فشل تحميل بيانات لوحة التحكم';
    } finally {
      this.loading = false;
    }
  }

  // Removed progress scaling per request

  gradientClass(index: number): string {
    const palettes = 6; // grad-0 .. grad-5
    return `grad-${index % palettes}`;
  }

  branchEmoji(index: number, name: string): string {
    const emojis = ['🍔','🍟','🌯','🍕','🥙','🍗','🍱','🥤','🧁','☕','🥪','🥗','🧆','🍩','🍜'];
    const seed = Math.abs((name?.length || 0) + index * 7);
    return emojis[seed % emojis.length];
  }

  goToBranch(b: { branch_id: string; branch_name: string }) {
    // Navigate to branches page with filter (query params)
    this.router.navigate(['/branches'], { queryParams: { branchId: b.branch_id, q: b.branch_name } });
  }

  goToAttendance(b: { branch_id: string }) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const date = `${yyyy}-${mm}-${dd}`;
    this.router.navigate(['/attendance-records'], { queryParams: { branchId: b.branch_id, date } });
  }
}
