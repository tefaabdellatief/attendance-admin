import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { SupabaseService, AppUser } from './core/supabase.service';
import { filter } from 'rxjs/operators';
import { SidebarComponent } from './core/ui/components/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, SidebarComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App implements OnInit {
  private readonly authFreeRoutes = ['/login'];

  // Avoid accessing injected services in field initializers (AOT-safe)
  private readonly currentUser = signal<AppUser | null>(null);

  private readonly currentUrl = signal<string>('');

  // Collapsed state for sidebar (persisted)
  readonly sidebarCollapsed = signal<boolean>(false);

  readonly showSidebar = computed(() => {
    const url = this.currentUrl().split('?')[0];
    return !!this.currentUser() && !this.authFreeRoutes.includes(url);
  });

  constructor(private router: Router, private sb: SupabaseService) {}

  ngOnInit(): void {
    // Initialize sidebar collapsed state from localStorage (browser only)
    try {
      const raw = localStorage.getItem('app_sidebar_collapsed');
      if (raw !== null) this.sidebarCollapsed.set(raw === 'true');
    } catch {}

    // Initialize signals now that DI is ready
    this.currentUser.set(this.sb.getCurrentUser());
    // Keep currentUser in sync with service observable
    this.sb.currentUser$.subscribe((u) => this.currentUser.set(u));

    // Initialize and track current URL
    this.currentUrl.set(this.router.url);
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.currentUrl.set(event.urlAfterRedirects);
      });
  }

  onCollapsedChange(collapsed: boolean) {
    this.sidebarCollapsed.set(!!collapsed);
    try {
      localStorage.setItem('app_sidebar_collapsed', String(!!collapsed));
    } catch {}
  }
}