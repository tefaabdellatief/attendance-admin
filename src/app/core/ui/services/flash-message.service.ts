import { Injectable } from '@angular/core';

export type FlashType = 'info' | 'success' | 'warning' | 'error';

interface FlashPayload {
  message: string;
  type: FlashType;
}

@Injectable({ providedIn: 'root' })
export class FlashMessageService {
  private readonly STORAGE_KEY = 'app_flash_message';

  set(message: string, type: FlashType = 'info') {
    try {
      const payload: FlashPayload = { message, type };
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore storage errors
    }
  }

  // Read and clear the message so it shows only once
  consume(): FlashPayload | null {
    try {
      const raw = sessionStorage.getItem(this.STORAGE_KEY);
      if (!raw) return null;
      sessionStorage.removeItem(this.STORAGE_KEY);
      return JSON.parse(raw) as FlashPayload;
    } catch {
      return null;
    }
  }

  clear() {
    try {
      sessionStorage.removeItem(this.STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}
