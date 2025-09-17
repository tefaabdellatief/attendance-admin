import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../core/supabase.service';
import { LoadingService } from '../../core/ui/services/loading.service';
import { FlashMessageService, FlashType } from '../../core/ui/services/flash-message.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  identifier = '';
  passcode = '';
  loading = false; // Keep for local button state
  error = '';
  flashMessage: string | null = null;
  flashType: FlashType = 'info';

  constructor(
    private router: Router, 
    private sb: SupabaseService,
    private loadingService: LoadingService,
    private flash: FlashMessageService
  ) {}

  ngOnInit(): void {
    const payload = this.flash.consume();
    if (payload?.message) {
      this.flashMessage = payload.message;
      this.flashType = payload.type ?? 'info';
    }
  }

  async submit() {
    this.error = '';
    this.loading = true;
    this.loadingService.show();
    
    try {
      const user = await this.sb.login(this.identifier.trim(), this.passcode);
      if (!user) {
        this.error = 'بيانات الاعتماد غير صالحة أو المستخدم غير نشط.';
        return;
      }
      // Clear any remaining flash message once logged in
      this.flash.clear();
      this.router.navigateByUrl('/dashboard');
    } catch (e: any) {
      this.error = e?.message ?? 'فشل تسجيل الدخول';
    } finally {
      this.loading = false;
      this.loadingService.hide();
    }
  }
}
