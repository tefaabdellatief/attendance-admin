import { Component, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { NgIf, AsyncPipe } from '@angular/common';
import { filter } from 'rxjs/operators';
import { SupabaseService } from './core/supabase.service';
import { FlashMessageService } from './core/ui/services/flash-message.service';
import { LoadingService } from './core/ui/services/loading.service';
import { SpinnerComponent } from './core/ui/components/spinner/spinner.component';
import { PageTransitionDirective } from './core/ui/directives/page-transition.directive';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIf, AsyncPipe, SpinnerComponent, PageTransitionDirective],
  template: `
    <div class="app-shell" dir="rtl">
      <aside class="sidebar" [class.open]="sidebarOpen" *ngIf="!isLoginPage">
        <div class="brand">
          <img src="favicon.ico" alt="دقدق برجر" onerror="this.style.display='none'" />
          <span>دقدق برجر</span>
        </div>
        <nav class="menu">
          <a routerLink="/dashboard" routerLinkActive="active" (click)="closeSidebarOnMobile()">
            <span class="icon">🏠</span>
            <span>لوحة تحكم دقدق برجر</span>
          </a>
          <a routerLink="/users" *ngIf="isLoggedIn()" routerLinkActive="active" (click)="closeSidebarOnMobile()">
            <span class="icon">👤</span>
            <span>المستخدمون</span>
          </a>
          <a routerLink="/branches" *ngIf="isLoggedIn()" routerLinkActive="active" (click)="closeSidebarOnMobile()">
            <span class="icon">🏢</span>
            <span>الفروع</span>
          </a>
          <a routerLink="/attendance-types" *ngIf="isLoggedIn()" routerLinkActive="active" (click)="closeSidebarOnMobile()">
            <span class="icon">🗂️</span>
            <span>أنواع الحضور</span>
          </a>
          <a routerLink="/shifts" *ngIf="isLoggedIn()" routerLinkActive="active" (click)="closeSidebarOnMobile()">
            <span class="icon">⏰</span>
            <span>الورديات</span>
          </a>
          <a routerLink="/attendance-records" *ngIf="isLoggedIn()" routerLinkActive="active" (click)="closeSidebarOnMobile()">
            <span class="icon">📝</span>
            <span>سجلات الحضور</span>
          </a>
          <a routerLink="/deductions" *ngIf="isLoggedIn()" routerLinkActive="active" (click)="closeSidebarOnMobile()">
            <span class="icon">💸</span>
            <span>الخصومات</span>
          </a>
          <a routerLink="/additions" *ngIf="isLoggedIn()" routerLinkActive="active" (click)="closeSidebarOnMobile()">
            <span class="icon">🎁</span>
            <span>المكافئات</span>
          </a>
          <a routerLink="/request-statuses" *ngIf="isLoggedIn()" routerLinkActive="active" (click)="closeSidebarOnMobile()">
            <span class="icon">🏷️</span>
            <span>حالات الطلبات</span>
          </a>
          <a routerLink="/inventory" *ngIf="isLoggedIn()" routerLinkActive="active" (click)="closeSidebarOnMobile()">
            <span class="icon">📦</span>
            <span>المخزون</span>
          </a>
          <a routerLink="/branch-inventory" *ngIf="isLoggedIn()" routerLinkActive="active" (click)="closeSidebarOnMobile()">
            <span class="icon">🏬</span>
            <span>مخزون الفروع</span>
          </a>
          <a routerLink="/inventory-transfer" *ngIf="isLoggedIn()" routerLinkActive="active" (click)="closeSidebarOnMobile()">
            <span class="icon">🔀</span>
            <span>تحويل المخزون</span>
          </a>
          <a routerLink="/inventory-transactions" *ngIf="isLoggedIn()" routerLinkActive="active" (click)="closeSidebarOnMobile()">
            <span class="icon">🧾</span>
            <span>سجل المخزون</span>
          </a>
          <div class="menu-section" *ngIf="isLoggedIn()">
            <div class="menu-header">
              <span class="icon">📊</span>
              <span>التقارير</span>
            </div>
            <div class="submenu">
              <a routerLink="/reports/employee-monthly" routerLinkActive="active" (click)="closeSidebarOnMobile()">
                <span>التقارير الشهرية</span>
              </a>
              <a routerLink="/reports/instant-salary" routerLinkActive="active" (click)="closeSidebarOnMobile()">
                <span>حاسبة الراتب الفوري</span>
              </a>
            </div>
          </div>
        </nav>
        <div class="sidebar-footer" *ngIf="isLoggedIn()">
          <button class="logout" (click)="logout()">تسجيل الخروج</button>
        </div>
      </aside>

      <div class="main-area" [class.full-width]="isLoginPage">
        <app-spinner *ngIf="loading$ | async" [overlay]="true" message="جاري التحميل..."></app-spinner>
        
        <header class="topbar" *ngIf="!isLoginPage">
          <div class="container topbar-inner">
            <div class="topbar-left">
              <button class="menu-btn" aria-label="menu" (click)="toggleSidebar()">☰</button>
              <h1>لوحة تحكم دقدق برجر</h1>
            </div>
            <div class="topbar-right">
              <div class="logo-container">
                <img src="favicon.ico" alt="دقدق برجر" class="main-logo" />
              </div>
            </div>
          </div>
        </header>
        <main class="content">
          <div class="container">
            <div appPageTransition>
            <router-outlet />
          </div>
          </div>
        </main>
      </div>
      <div class="sidebar-overlay" [class.show]="sidebarOpen && !isLoginPage" (click)="sidebarOpen=false"></div>
    </div>
  `,
  styles: [`
  `]
})
export class App {
  protected readonly title = signal('attendance-admin');
  sidebarOpen = false;
  loading$;
  isLoginPage = false;
  
  constructor(
    private sb: SupabaseService, 
    private router: Router,
    private loadingService: LoadingService,
    private flash: FlashMessageService
  ) {
    this.loading$ = this.loadingService.loading$;
    
    // Check if current route is login page
    this.checkIfLoginPage(this.router.url);
    
    // Subscribe to route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.checkIfLoginPage(event.url);
    });

    // Subscribe to session expiry: set a one-time flash and redirect to login
    this.sb.sessionExpired$.subscribe(() => {
      this.flash.set('انتهت الجلسة لأسباب أمنية. يرجى تسجيل الدخول مرة أخرى.', 'warning');
      if (!this.isLoginPage) {
        this.router.navigateByUrl('/login');
      }
    });

    // Track user activity to extend idle-based session
    const activityHandler = () => this.sb.notifyActivity();
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(evt => window.addEventListener(evt, activityHandler, { passive: true }));
  }
  
  checkIfLoginPage(url: string) {
    this.isLoginPage = url.includes('/login');
  }

  isLoggedIn() {
    return this.sb.isLoggedIn();
  }

  logout() {
    this.loadingService.show();
    this.sb.logout();
    this.router.navigateByUrl('/login').then(() => {
      this.loadingService.hide();
    });
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }
  closeSidebarOnMobile() {
    // Close when navigating on small screens
    this.sidebarOpen = false;
  }
}
