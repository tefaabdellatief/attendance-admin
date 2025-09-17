import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { SupabaseService } from './supabase.service';

export const authGuard: CanActivateFn = (): boolean | UrlTree => {
  const router = inject(Router);
  const auth = inject(SupabaseService);
  return auth.isLoggedIn() ? true : router.parseUrl('/login');
};
