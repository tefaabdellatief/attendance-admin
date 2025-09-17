import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BehaviorSubject, Subject } from 'rxjs';
import { environment as devEnv } from '../../environments/environment.development';

export interface AppUser {
  id: string;
  username: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  national_number: string;
  reference_image?: string | null;
  front_id_image?: string | null;
  back_id_image?: string | null;
  feesh_image?: string | null;
  medical_certificate_image?: string | null;
  is_active: boolean;
  shift_id?: string | null;
  base_salary: number;
  official_off_days_per_month: number;
  created_at?: string;
}

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;
  private isBrowser: boolean;
  private currentUserSubject = new BehaviorSubject<AppUser | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();
  // Idle-based session timeout: last activity timestamp
  private readonly LAST_ACTIVITY_KEY = 'app_user_last_activity';
  private readonly SESSION_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours
  private sessionExpiryTimer: any = null;
  private sessionExpiredSubject = new Subject<void>();
  sessionExpired$ = this.sessionExpiredSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    
    // Create Supabase client with better error handling
    this.supabase = createClient(devEnv.supabaseUrl, devEnv.supabaseAnonKey, {
      auth: {
        // We manage session locally; avoid Supabase auth persistence to prevent Navigator Lock errors
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      },
      global: {
        headers: {
          'X-Client-Info': 'attendance-admin'
        }
      }
    });
    
    // Initialize current user only in the browser to avoid SSR ReferenceError
    if (this.isBrowser) {
      const u = this.getPersistedUser();
      if (u) {
        // if session expired, force logout
        if (this.isSessionExpired()) {
          this.logout();
        } else {
          this.currentUserSubject.next(u);
          this.scheduleSessionExpiry();
        }
      }
    }
  }

  async login(identifier: string, passcode: string): Promise<AppUser | null> {
    // Resolve username if a national_number is provided
    let username = identifier;
    try {
      const maybeDigits = identifier.trim();
      if (/^\d{5,}$/.test(maybeDigits)) {
        const { data: userByNN } = await this.supabase
          .from('users')
          .select('username')
          .eq('national_number', maybeDigits)
          .limit(1)
          .maybeSingle();
        if (userByNN?.username) username = userByNN.username as string;
      }
    } catch {
      // ignore lookup errors; proceed with identifier as username
    }

    // Call mobile RPC that handles hashing comparison server-side
    const { data, error } = await this.supabase.rpc('auth_admin', {
      p_username: username,
      p_passcode: passcode,
    });
    if (error) throw error;

    // Expect a JSON object like { status: 'success'|'error', ... }
    const payload = data as any;
    if (!payload) return null;

    if (payload.status !== 'success') {
      const msg = payload.message || 'Invalid credentials';
      throw new Error(msg);
    }

    const mapped: AppUser = {
      id: payload.user_id,
      username: payload.username,
      full_name: payload.full_name,
      email: payload.email ?? null,
      phone: payload.phone ?? null,
      national_number: payload.national_number,
      is_active: !!payload.is_active,
      base_salary: payload.base_salary ?? 0,
      official_off_days_per_month: payload.official_off_days_per_month ?? 0,
    };
    this.setPersistedUser(mapped);
    this.setActivityTimestamp(Date.now());
    this.clearSessionExpiryTimer();
    this.scheduleSessionExpiry();
    this.currentUserSubject.next(mapped);
    return mapped;
  }

  logout() {
    this.clearPersistedUser();
    this.clearActivityTimestamp();
    this.clearSessionExpiryTimer();
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    if (this.isSessionExpired()) {
      this.logout();
      return false;
    }
    return !!this.currentUserSubject.value;
  }

  // Expose the currently logged-in admin/user
  getCurrentUser(): AppUser | null {
    if (this.isSessionExpired()) {
      this.logout();
      return null;
    }
    return this.currentUserSubject.value;
  }

  table<T = any>(name: string) {
    return this.supabase.from(name) as any;
  }

  // Call a Postgres function (RPC)
  async rpc(fn: string, params: any = {}) {
    try {
      console.log(`RPC Call: ${fn}`, params);
      const { data, error } = await this.supabase.rpc(fn, params);
      
      if (error) {
        console.error(`RPC Error (${fn}):`, error);
        return { data: null, error };
      }
      
      console.log(`RPC Response (${fn}):`, data);
      return { data, error: null };
    } catch (error) {
      console.error(`RPC Exception (${fn}):`, error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  private getPersistedUser(): AppUser | null {
    if (!this.isBrowser) return null;
    try {
      const raw = localStorage.getItem('app_user');
      return raw ? (JSON.parse(raw) as AppUser) : null;
    } catch {
      return null;
    }
  }
  private setPersistedUser(user: AppUser) {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem('app_user', JSON.stringify(user));
    } catch {
      // ignore storage errors
    }
  }
  private clearPersistedUser() {
    if (!this.isBrowser) return;
    try {
      localStorage.removeItem('app_user');
    } catch {
      // ignore
    }
  }

  // Session timeout helpers
  // Public: notify user activity to extend session
  notifyActivity() {
    if (!this.currentUserSubject.value) return;
    if (this.isSessionExpired()) {
      // Will be handled in next guard/check
      return;
    }
    this.setActivityTimestamp(Date.now());
    this.scheduleSessionExpiry();
  }

  private setActivityTimestamp(ts: number) {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(this.LAST_ACTIVITY_KEY, String(ts));
    } catch {
      // ignore
    }
  }
  private getActivityTimestamp(): number | null {
    if (!this.isBrowser) return null;
    try {
      const raw = localStorage.getItem(this.LAST_ACTIVITY_KEY);
      return raw ? Number(raw) : null;
    } catch {
      return null;
    }
  }
  private clearActivityTimestamp() {
    if (!this.isBrowser) return;
    try {
      localStorage.removeItem(this.LAST_ACTIVITY_KEY);
    } catch {
      // ignore
    }
  }
  private isSessionExpired(): boolean {
    const last = this.getActivityTimestamp();
    if (!last) return false; // no timestamp yet
    const now = Date.now();
    return now - last >= this.SESSION_TIMEOUT_MS;
  }
  private clearSessionExpiryTimer() {
    if (this.sessionExpiryTimer) {
      clearTimeout(this.sessionExpiryTimer);
      this.sessionExpiryTimer = null;
    }
  }
  private scheduleSessionExpiry() {
    const last = this.getActivityTimestamp();
    if (!last) return;
    const now = Date.now();
    const remaining = this.SESSION_TIMEOUT_MS - (now - last);
    if (remaining <= 0) {
      // emit expiry event then logout
      this.sessionExpiredSubject.next();
      this.logout();
      return;
    }
    this.clearSessionExpiryTimer();
    this.sessionExpiryTimer = setTimeout(() => {
      this.sessionExpiredSubject.next();
      this.logout();
    }, remaining);
  }
}
