import { Component, computed, signal, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { SupabaseService, AppUser } from '../../../supabase.service';
import { filter } from 'rxjs/operators';

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  expanded?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  // AOT-safe: do not access injected services in field initializers
  private readonly currentUserSignal = signal<AppUser | null>(null);

  readonly isCollapsed = signal(false);

  @Input()
  set collapsed(value: boolean) {
    this.isCollapsed.set(!!value);
  }
  get collapsed(): boolean { return this.isCollapsed(); }

  @Output()
  collapsedChange = new EventEmitter<boolean>();

  readonly userName = computed(() => this.currentUserSignal()?.full_name ?? 'المدير');
  readonly userInitials = computed(() => {
    const name = this.userName();
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  });

  readonly menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      title: 'لوحة تحكم نخيل برجر',
      icon: '🏠',
      route: '/dashboard',
    },
    {
      id: 'users',
      title: 'المستخدمون',
      icon: '👥',
      route: '/users',
    },
    {
      id: 'branches',
      title: 'الفروع',
      icon: '🏢',
      route: '/branches',
    },
    {
      id: 'inventory',
      title: 'إدارة المخزون',
      icon: '📦',
      expanded: false,
      children: [
        { id: 'products', title: 'المنتجات', icon: '🍔', route: '/products' },
        { id: 'inventory-items', title: 'عناصر المخزون', icon: '📋', route: '/inventory' },
        { id: 'branch-inventory', title: 'مخزون الفروع', icon: '🏪', route: '/branch-inventory' },
        { id: 'inventory-transactions', title: 'حركات المخزون', icon: '📊', route: '/inventory-transactions' },
        { id: 'inventory-transfer', title: 'نقل المخزون', icon: '🚚', route: '/inventory-transfer' },
      ],
    },
    {
      id: 'attendance',
      title: 'إدارة الحضور',
      icon: '⏰',
      children: [
        { id: 'shifts', title: 'الورديات', icon: '🕐', route: '/shifts' },
        { id: 'attendance-types', title: 'أنواع الحضور', icon: '📅', route: '/attendance-types' },
        { id: 'attendance-records', title: 'سجلات الحضور', icon: '📝', route: '/attendance-records' },
      ],
    },
    {
      id: 'payroll',
      title: 'الرواتب والحوافز',
      icon: '💰',
      children: [
        { id: 'deductions', title: 'الخصومات', icon: '💸', route: '/deductions' },
        { id: 'additions', title: 'المكافآت', icon: '🎁', route: '/additions' },
      ],
    },
    {
      id: 'reports',
      title: 'التقارير والأدوات',
      icon: '📊',
      children: [
        { id: 'monthly-report', title: 'التقرير الشهري', icon: '📈', route: '/employee-monthly-report' },
        { id: 'salary-calculator', title: 'حاسبة الراتب الفوري', icon: '🧮', route: '/instant-salary-calculator' },
      ],
    },
    {
      id: 'requests',
      title: 'حالات الطلبات',
      icon: '📝',
      route: '/request-statuses',
    },
  ];

  constructor(private sb: SupabaseService, private router: Router) {
    // Initialize current user and subscribe for changes
    this.currentUserSignal.set(this.sb.getCurrentUser());
    this.sb.currentUser$.subscribe((u) => this.currentUserSignal.set(u));

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.expandActiveGroups());
    this.expandActiveGroups();
  }

  ngOnInit(): void {
    // Emit current collapsed state to parent on init to sync
    this.collapsedChange.emit(this.isCollapsed());
  }

  trackById(_: number, item: MenuItem): string {
    return item.id;
  }

  toggleSidebar(): void {
    this.isCollapsed.update((value) => !value);
    this.collapsedChange.emit(this.isCollapsed());
  }

  toggleGroup(item: MenuItem): void {
    item.expanded = !item.expanded;
  }

  isActive(route?: string): boolean {
    if (!route) return false;
    return this.router.isActive(route, { paths: 'subset', queryParams: 'ignored', fragment: 'ignored', matrixParams: 'ignored' });
  }

  hasActiveChild(item: MenuItem): boolean {
    return !!item.children?.some((child) => this.isActive(child.route));
  }

  async logout(): Promise<void> {
    try {
      await this.sb.logout();
      await this.router.navigate(['login']);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  private expandActiveGroups(): void {
    for (const item of this.menuItems) {
      if (item.children) {
        item.expanded = this.hasActiveChild(item);
      }
    }
  }
}
